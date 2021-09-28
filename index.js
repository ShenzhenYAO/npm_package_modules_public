let modules = {
    // get a dict of path, name, and extention name of a file
    // Note: the full path string of the file must be give as String.raw``
    // let filename_with_path = String.raw`data\in\prototype\__xml/egpv7\__egtask_example.xml`
    get_filename:
        function get_filename(filename_with_path) {
            // console.log(filename_with_path)
            // convert backslash to slash
            filename_with_path = filename_with_path.replace(/\\/g, '/')
            // console.log(filename_with_path)
            let startpos_slash = filename_with_path.lastIndexOf('/')
            let filename_with_ext = filename_with_path.substr(startpos_slash + 1)
            let startpos_dot = filename_with_ext.lastIndexOf('.')
            let path = filename_with_path.substring(0, startpos_slash)
            let name = filename_with_ext.substring(0, startpos_dot)
            let ext = filename_with_ext.substr(startpos_dot + 1)
            return { path: path, name: name, ext: ext }
        }, // function get_filename(filename_with_path)
        
    // get the textContent of the top level of the dom (not including inner text of its children)
    getDomTopTextContent:
        //function to remove it's children
        function getDomTopTextContent(theDom) {

            // make a copy of theDom (theDom_copy), and work on theDom_copy
            let jsdom = require("jsdom");
            let { window } = new jsdom.JSDOM(`...`);
            let $ = require("jquery")(window);
            // get the outerHTML of theDOM
            let DOMOuterHTML = theDom.outerHTML
            let theDom_copy = $(DOMOuterHTML)[0]

            // Note: do not work on theDom directly. Once the children nodes are deleted from theDom, it'll affect theDom object outside of the current function
            //       As a result, children nodes of theDom object outside the current function will also be removed
            // the idea is to remove all children of theDom_copy, so that the theDom only contains textContent of itself
            for (let i = theDom_copy.children.length - 1; i >= 0; i--) {
                theDom_copy.children[i].remove()
            }

            let toptext = theDom_copy.textContent
            // console.log(toptext)
            return toptext
        },
};

module.exports = modules;