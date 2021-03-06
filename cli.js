import yargs from 'yargs'
import csvToSql from './csv-to-sql.js'
import { hideBin } from 'yargs/helpers'
import * as isql from './index.js'
import Papa from 'papaparse'

const defaults = yargs => {
  return yargs
  .positional('statement', {
    description: 'SQL statement'
  })
  .option('input', {
    type: 'string',
    description: 'CID of the input sqlite database'
  })
 .option('export', {
    type: 'string',
    description: 'Export a CAR file. Accepts: file path, "stdout" and "w3s" (web3.storage)'
  })
  .option('exec', {
    type: 'boolean',
    default: true,
    description: 'Output the response of the SQL statement. See --format for changing output type'
  })
  .option('delta', {
    type: 'boolean',
    default: false,
    description: 'Export a diff of the new blocks'
  })
  .option('format', {
    default: 'json',
    description: 'Format to output the response of the statement in. Accepts "json" and "csv"'
  })
}

const csvOptions = yargs => {
  return defults(args)
  .option('tableName', {
    description: 'Name of the table used in CREATE and INSERT statements'
  })
  .option('dumpsql', {
    type: 'boolean',
    default: false,
    description: 'Output the SQL for the given CSV and exit'
  })
}

const run = async argv => {
  const { result, db } = await isql.exec(argv.statement, argv.input)
  if (argv.exec) {  
    if (argv.format === 'json') {
      console.log(JSON.stringify(result))
    } else if (argv.format === 'csv') {
      if (result.length > 1) {
        throw new Error('Cannot serialize multiple select statements to CSV, use JSON export')
      }
      const r = result[0]
      const csv = Papa.unparse({ data: r.values, fields: r.columns })
      console.log(csv)
    } else {
      throw new Error(`Unknown export format: "${arvg.format}"`)
    }
  }

  if (argv.export) {
    const output = await isql.exporter(db)
  }
}

yargs(hideBin(process.argv))
  .command('$0 <statement>', 'Run SQL on IPFS', defaults, run)
  .command('csv <path>', 'Converts a CSV file to a SQL input <statement>', csvOptions, async argv => {
    // todo: csv to sql
    argv.sql = await csvToSql(argv.path)
    return run(argv)
  })
  .parse()
