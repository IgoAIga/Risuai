"use strict";
// Isolated regression checks: uses synthetic assets and an ephemeral local server.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const { fork } = require("node:child_process");
const { once } = require("node:events");
const { createRequire } = require("node:module");
const repoRoot = path.resolve(__dirname, "../..");
const req = createRequire(path.join(repoRoot, "package.json"));
const ts = req("typescript");
const serverPath = path.join(__dirname, "server.cjs");

if (process.env.RISU_IMPORT_TEST_CHILD === "1") {
  const net = require("node:net");
  const listen = net.Server.prototype.listen;
  net.Server.prototype.listen = function () {
    const server = this;
    return listen.call(this, 0, "127.0.0.1", () =>
      process.send({ port: server.address().port }),
    );
  };
  require(serverPath);
} else {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}

async function main() {
  const testRoot = fs.mkdtempSync(
    path.join(require("node:os").tmpdir(), "risu-import-test-"),
  );
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const pub = await crypto.subtle.exportKey("jwk", key.publicKey);
  const publicHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(pub))
    .digest("hex");
  const enc = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  const tokenBody =
    enc({ alg: "ES256", typ: "JWT" }) +
    "." +
    enc({
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
      pub,
    });
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key.privateKey,
    Buffer.from(tokenBody),
  );
  const token = tokenBody + "." + Buffer.from(signature).toString("base64url");
  for (const unlimited of [false, true]) {
    const cwd = path.join(testRoot, unlimited ? "private" : "default");
    fs.mkdirSync(path.join(cwd, "save"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "save/__known_public_key_hashes.json"),
      JSON.stringify([publicHash]),
    );
    const child = fork(__filename, [], {
      cwd,
      env: {
        ...process.env,
        RISU_IMPORT_TEST_CHILD: "1",
        RISU_UNLIMITED_STORAGE: unlimited ? "1" : "0",
      },
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    try {
      const [{ port }] = await Promise.race([
        once(child, "message"),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(Error("Server startup timeout")),
            10000,
          ).unref(),
        ),
      ]);
      const url = `http://127.0.0.1:${port}`;
      const storagePath = Buffer.from(
        "assets/synthetic-import-test.png",
      ).toString("hex");
      const headers = {
        "risu-auth": token,
        "content-type": "application/octet-stream",
        "file-path": storagePath,
      };
      for (let i = 0; i < 2010; i++) {
        const r = await fetch(url + "/api/write", {
          method: "POST",
          headers,
          body: Buffer.from("synthetic"),
        });
        await r.text();
        assert.equal(
          r.status,
          !unlimited && i >= 2000 ? 429 : 200,
          `write ${i}, unlimited=${unlimited}`,
        );
      }
      if (unlimited) {
        const read = await fetch(url + "/api/read", { headers });
        assert.equal(read.status, 200);
        assert.equal(await read.text(), "synthetic");
        const noAuth = await fetch(url + "/api/write", {
          method: "POST",
          headers: {
            "content-type": "application/octet-stream",
            "file-path": storagePath,
          },
          body: Buffer.from("bad"),
        });
        assert.equal(noAuth.status, 400);
        assert.equal((await noAuth.json()).error, "No auth header");
        assert.equal(
          fs.readFileSync(path.join(cwd, "save", storagePath), "utf8"),
          "synthetic",
        );
      }
      console.log(
        `PASS: ${unlimited ? "private storage accepts >2000 writes and still requires auth" : "default storage still enforces its quota"}`,
      );
    } finally {
      child.kill();
      if (child.exitCode === null) await once(child, "exit");
    }
  }

  const source = fs
    .readFileSync(path.join(repoRoot, "src/ts/storage/nodeStorage.ts"), "utf8")
    .replace(/^import .*\r?\n/gm, "");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  let requests = 0,
    signatures = 0;
  const context = vm.createContext({
    exports: {},
    Buffer,
    Date,
    setTimeout,
    Response,
    fetch: async (_url, opts) => {
      requests++;
      assert.equal(opts.headers["risu-auth"], `signature-${requests}`);
      return requests === 1
        ? new Response("{}", { status: 429, headers: { "Retry-After": "0" } })
        : Response.json({ success: true });
    },
  });
  vm.runInContext(compiled, context);
  const storage = new context.exports.NodeStorage();
  storage.checkAuth = async () => {};
  storage.createAuth = async () => `signature-${++signatures}`;
  await storage.setItem("assets/test.png", new Uint8Array([1]));
  assert.equal(requests, 2);
  assert.equal(signatures, 2);
  context.fetch = async () =>
    Response.json({ error: "Invalid authentication" }, { status: 401 });
  await assert.rejects(
    () => storage.setItem("assets/test.png", new Uint8Array([1])),
    /HTTP 401.*Invalid authentication/,
  );
  console.log(
    "PASS: 429 waits and re-signs; authentication failures retain HTTP error details",
  );

  const moduleSource = fs.readFileSync(
    path.join(repoRoot, "src/ts/process/modules.ts"),
    "utf8",
  );
  const ast = ts.createSourceFile(
    "modules.ts",
    moduleSource,
    ts.ScriptTarget.Latest,
    true,
  );
  const fn = ast.statements.find(
    (s) => ts.isFunctionDeclaration(s) && s.name?.text === "importModule",
  );
  const fnJS = ts.transpileModule(fn.getText(ast), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  for (const ext of ["charx", "risum"]) {
    const alerts = [];
    const modules = [];
    const ctx = vm.createContext({
      exports: {},
      Buffer,
      Error,
      String,
      console: { error: () => {} },
      language: {
        errors: { noData: "Import failed" },
        successImport: "Imported",
      },
      DBState: { db: { modules } },
      selectSingleFile: async () => ({
        name: `test.${ext}`,
        data: new Uint8Array([1]),
      }),
      importCharacterProcess: async () => {
        throw Error("save failed");
      },
      readModule: async () => {
        throw Error("save failed");
      },
      alertError: (m) => alerts.push(["error", m]),
      alertNormal: (m) => alerts.push(["success", m]),
    });
    vm.runInContext(fnJS, ctx);
    await ctx.exports.importModule();
    assert.equal(modules.length, 0);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], "error");
    assert.match(alerts[0][1], /save failed/);
    if (ext === "charx") {
      ctx.importCharacterProcess = async () => ({ name: "synthetic" });
      ctx.convertCharacterToModule = (x) => x;
    } else {
      ctx.readModule = async () => ({ name: "synthetic" });
    }
    alerts.length = 0;
    await ctx.exports.importModule();
    assert.equal(modules.length, 1);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][0], "success");
  }
  console.log(
    "PASS: CHARX and RISUM success alerts appear only after successful registration",
  );
}
