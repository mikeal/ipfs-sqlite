import initSqlJs from 'sql.js'
import bent from 'bent'
import { packToBlob } from 'ipfs-car/pack/blob'
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory' // You can also use the `level-blockstore` module

const gateway = bent('https://ipfs.io', 'buffer')
// or if you are in a browser:
// const initSqlJs = window.initSqlJs;

// eventually we'll want all these methods to take a CID argument for the WASM binary
// that gets loaded by sql.js
const getdb = (prev) => initSqlJs().then(SQL => new SQL.Database(prev))

const getfile = cid => {
  if (typeof cid !== 'string') cid = cid.toString()
  return gateway(`/ipfs/${cid}`)
}

const exec = async (str, prev) => {
  if (prev) prev = await getfile(prev)
  const db = await getdb(prev)
  return db.run(str)
}

const binaryExport = async (str, prev) => {
  if (prev) prev = await getfile(prev)
  const db = await getdb(prev)
  db.run(str)
  return db.export()
}

const exporter = async (str, prev) => await packToBlob({
  input: [ await binaryExport(str, prev) ],
  blockstore: new MemoryBlockStore()
})

const run = async () => {
  let sqlstr = `CREATE TABLE hello (a int, b char); 
INSERT INTO hello VALUES (0, 'hello');
INSERT INTO hello VALUES (1, 'world');`
  const { root, car } = await exporter(sqlstr)
  console.log((new Buffer(await car.arrayBuffer())).toString())
  console.log({root, car})
}
run()
