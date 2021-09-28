const mymodules = require('./index.js');
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
const $ = require("jquery")(window);

(async () => {

    let str= `data\in\prototype\__xml/egpv7\__egtask_example.xml`
    let fn = mymodules.get_filename(str)
    console.log(fn)

    let htmltext = `
    <p> Text at top level (within the p tag)
        <span> Text1 in the child level ( within the first span tag)</span>
        <span> Text2 in the child level ( within the second span tag)</span>
    </p>
    `
    let theDOM= $(htmltext)[0]
    let topText = mymodules.getDomTopTextContent(theDOM)
    console.log(topText)

})()

