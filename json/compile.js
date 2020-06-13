const fs = require('fs').promises
const path = require('path')

const main = async () => {

  const template = JSON.parse(await fs.readFile(path.join(__dirname, 'template.json')))

  for (let type of template.Actor.types) {
    console.log(type)
    const typeTemplate = JSON.parse(await fs.readFile(path.join(__dirname, 'partials', type + '.json')))
    template.Actor[type] = typeTemplate
  }

  for (let type of template.Item.types) {
    console.log(type)
    const typeTemplate = JSON.parse(await fs.readFile(path.join(__dirname, 'partials', type + '.json')))
    template.Item[type] = typeTemplate
  }

  await fs.writeFile(path.join(__dirname, '..', 'template.json'), JSON.stringify(template, false, 2))
}

main()
