const fs = require('node:fs/promises')
const { existsSync } = require('node:fs')

const run = async () => {
  const interfaceToCopy = await fs.readdir('./interfaces/src/lib/workflows');
  for (const inter of interfaceToCopy) {
    const directory = `./apps/${inter.replace('.ts', '')}/src/generated/`
    if (!existsSync(directory)) {
      await fs.mkdir(directory)
    }
    for (const name of interfaceToCopy) {
      await fs.copyFile(
        './interfaces/src/lib/workflows/' + name,
        directory + name
      )
    }
  }
}

run().catch((err) => {
  console.log(err)
  process.exit(1)
})
