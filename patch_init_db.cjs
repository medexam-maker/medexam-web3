const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const search = `    client.release();
    console.log("PostgreSQL isolated tables schema initialization & migration complete!");
  } catch (err: any) {
    console.error("PostgreSQL Initialization Notice (fallback to memory if offline):", err.message);
    isDbConnected = false;
  }
  })();`;

const replace = `    client.release();
    console.log("PostgreSQL isolated tables schema initialization & migration complete!");
  } catch (err: any) {
    console.error("PostgreSQL Initialization Notice (fallback to memory if offline):", err.message);
    isDbConnected = false;
    dbInitPromise = null;
  }
  })();`;

serverCode = serverCode.replace(search, replace);
fs.writeFileSync('server.ts', serverCode);
