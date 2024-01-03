const fs = require('node:fs/promises')

const run = async () => {
  const interfaceToCopy = await fs.readdir('./interfaces/src/lib/workflows');
  for (const filename of interfaceToCopy) {
    const file = await fs.readFile('./interfaces/src/lib/workflows/' + filename)
    const noexte = filename.replace('.ts', '');
    const basepath = `apps/${noexte}/src/interface.ts`
    await fs.writeFile(basepath, file)
  }
}

run().catch((err) => {
  console.log(err)
  process.exit(1)
})
