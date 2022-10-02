let modules = {

    clean_xhtml_v2:
    /* 
        given a html code:
            1. change tag names (e.g., <p> to <p__tag0824__>) 
            2. convert self-closing tags (e.g., <br/> to conventional tags <br></br>)
            3. remove comments
    */
        function clean_xhtml_v2(xhtmlstr = '__demo__', original_linebreak = '__originallinebreak0824__', tag_suffix = '__tag0824__', tag_linebreak = '__taglinebreak0824__') {
            let jsdom = require("jsdom");
            let { window } = new jsdom.JSDOM(`...`);
            let $ = require("jquery")(window);

            let masks_dict = {}
            if (xhtmlstr === '__demo__') {
                xhtmlstr = `
    
        <p class='1 ok/'>this is the first part with a "
        
            <p class='1a this is'>text of lay2p1</p><P class='1b &lt;/that&gt;'>text of lay2p2</p>
            <P class="1c ">text of lay2p3</p>
            <P         class='1d'>
            it's of lay2p4 with a single =" </p>
            <!-- this is a comment !!!-->
            <br/><mytag><strong id='<p>'></stRong></mYtag> <mytag></MyTag><img class="it's possible" />
            <a href="http://this"       />
            <h1 styles='hello world ! '       />
            this is the second part
        </p>
        `
                /* The xhtml must follow several basic laws of legal html code:
                    - no space between < and the tag name (e.g., <p, not <  p)
                    - no line changes for a single tag, (e.g., <p class='...'>, not <p \n class='...>) whereas '\n' for a line change mark
                    - using character entities for html reserved html in attribute string or text contents (e.g., <p class = "x&lt;2"> when y &gt;2 </p>, not <p class = 'x<2'> when y>2)
                    ref: https://www.w3.org/TR/WD-html40-970708/sgml/entities.html
                */
            } // if xhtmlstr 

            // console.log('xhmtlstr====', xhtmlstr)

            let resultStr = xhtmlstr

            /* 1. remove the original line breakers, which cause a lot of problems when using match() ...
            */
            let originalchars, maskcat, maskprefix, masksuffix

            originalchars = '\n'
            maskcat = 'original line break'
            let masked1_dict = this.replace_with_mark(resultStr, originalchars, maskcat)
            resultStr = masked1_dict['masked']
            let masks1_dict = masked1_dict['masks']
            // console.log('str0====', str0)
            masks_dict = { ...masks_dict, ...masks1_dict }

            // console.log('xhtmlstr ===', xhtmlstr)
            // 1. get tagnames (in uppercase) by jquery (jq)
            // a. convert html to a jq object 
            let _jq = $(`<root>${xhtmlstr}</root>`)
            /* In the example xhtmlstr, the tag p[class= '1a...'] has two lines of textContent: the line 'this is the first part' is before p[class='1a..'], the tile 'this is the second part' after p[class='1b..']
             jq does not recognize the second line. Instead, it automatically adds </p> after the first part, and <p> after the second line. Thus, the second line becomes a text outside tags
             jq thus changed the html code :
            console.log(jq1.html())
            
            BTW: The problem also appears in python etree. In Python, there is a workaround -- the first line (inside-tag-text) is captured in the attribtue <ET element>.text, 
             while the secondline (outside-tag-text) is collected in the attribute <elemnt>.tail. The complete text content of the element can be obtained by combining the text from .text and .tail to have .
              (ref: 1) my project ml_text, preparedata.py in example201; and 2) https://stackoverflow.com/questions/27892946/python-xml-etree-not-reading-xml-text )
            
             To my knownledge, there is no such peer workaround (like Python ET element .tail) in jq. The closest might be .contents(). However, it is based on the new html code that has been manipulated by jq.
             By that approach, the secondline in the example is no longer treated as in the same element as the first line is in. 
            
             The following provides a workaround to rename a tagname into something that jq cannot not recognize (e.g., rename a p tag into p__0824__). Jq won't make changes to tags that it cannot recognize.
             That is what we want, -- leave the original text contents alone instead of messing it up!
            
             Techinically, there are several problems to handle:
            
             ******The first is to find the tagnames. *******
                The tagnames are either in </tagname> or <tagname ... />. It seems that they can be identified by matching RegEx patterns:
                    1. the first word wrapped within < and >, i.e., <tagname ... >  =>  adding escape marks:  '\<(.*)\>') => firstword of * : 'tagname ...'.split(' ')[0]
                    why would 1 be required givien that a tagname always appear in the close tag </tagName>?
                    consider <tAg></Tag> in which the start is 'tAg' and the close 'Tag'. tagname should be case sensitive, each case form should be identified
                    2. anything wrapped within </ and >, i.e., </*>  => adding escape marks:  '\<\/(.*)\>')  
                    3. the first word wrapped within < and  />, i.e., <tagname ... />  =>  adding escape marks:  '\<(.*)\/\>') => firstword of * : 'tagname ...'.split(' ')[0]
                    actually the third pattern is covered in the first pattern
            
                A problem with .match() is that it would treat the following as one matched instance although there are mulitple </p> closing tags. 
                    </p><P class='1b </that>'>text of lay2p2</p> 
                The workaround is to force changing line afert a '<', and a '>'
            */

            // add break before '<'
            originalchars = '<'
            maskcat = 'tagstart line break'
            maskprefix = '\n__'
            masksuffix = '__\n<'
            let masked2_dict = this.replace_with_mark(resultStr, originalchars, maskcat, maskprefix = maskprefix, masksuffix = masksuffix, debug = 0)
            let masks2_dict = masked2_dict['masks']
            masks_dict = { ...masks_dict, ...masks2_dict }

            resultStr = masked2_dict['masked']
            originalchars = '>'
            maskcat = 'tagend line break'
            maskprefix = '>\n__'
            masksuffix = '__\n'
            let masked3_dict = this.replace_with_mark(resultStr, originalchars, maskcat, maskprefix = maskprefix, masksuffix = masksuffix, debug = 0)

            resultStr = masked2_dict['masked']
            // console.log('str1 ====', str1)
            let masks3_dict = masked3_dict['masks']
            // console.log('mask2', replace2_dict['masks'])  
            masks_dict = { ...masks_dict, ...masks3_dict }

            /*
                The above match() method would misclassify 'that' as a tagname in the following instance:
                    <p class='1a<this is/that is>'>text of lay2p1</p>, in which '/that is>' would be considered a match and 'that' a tagName, while acutally it is part of the attribute class.
            
                To avoid such misclassfication, indeed we can use jq to identify the tagnames! 
                Jq would mess up the text contents. However, it identifies tagnames correctly, whether the tagname is recognizable (e.g., P, H1), or not (e.g., MYTAG).
            */

            let tagnamedicts = this.make_origin_jq_tagnames_dicts(xhtmlstr, resultStr)
            // console.log('tagnamedicts', tagnamedicts)
            tagnames_originalcase_arr = tagnamedicts['tagnames_originalcase_arr']
            tagnames_dict_jq_to_origin = tagnamedicts['tagnames_dict_jq_to_origin']
            tagnames_dict_origin_to_jq = tagnamedicts['tagnames_dict_origin_to_jq']

            /*
            with the dict tagnames_dict_origin_to_jq, we can rename the tagnames, like <p to <p__0824__ or </mYtag> to /mYtag__0824>
            */
            let original_tagnames_arr = Object.keys(tagnames_dict_origin_to_jq)

            original_tagnames_arr.forEach(original_tagname => {
                // console.log(original_tagname)
                let pattern, re, replacestr
                pattern = `\<${original_tagname} `
                replacestr = `<${original_tagname}${tag_suffix}`
                re = new RegExp(pattern, 'g')
                resultStr = resultStr.replace(re, replacestr)
        
                pattern = `\/${original_tagname}\>`
                replacestr = `\/${original_tagname}${tag_suffix}\>`
                re = new RegExp(pattern, 'g')
                resultStr = resultStr.replace(re, replacestr)
        
                pattern, re, replacestr
                pattern = `\<${original_tagname}\/\>`
                replacestr = `<${original_tagname}${tag_suffix}`
                re = new RegExp(pattern, 'g')
                resultStr = resultStr.replace(re, replacestr)

            })
            // console.log('resultStr===============', stresultStrr2)

            // to this stage, we have changed the tag names from like <p> to p__tag0824
            // note that we did not make changes to strings like a tag name but are indeed part of the attribute or property
            resultStr = this.convertSelfClosingHTML_to_OldSchoolHTML(resultStr)
            // remove the tag line breaks
            resultStr = this.remove_masks(resultStr, masks_dict, maskcat = 'tagend line break')
            resultStr = this.remove_masks(resultStr, masks_dict, maskcat = 'tagstart line break')
            resultStr = this.remove_masks(resultStr, masks_dict, maskcat = 'original line break')
            // console.log('resultStr===============', resultStr)

            resultStr = this.remove_comments(resultStr)
            resultStr = this.remove_empty_lines(resultStr)

            // console.log('resultStr===============', resultStr) 


            return {
                original: xhtmlstr,
                changed: resultStr,
                tagnames_dict_jq_to_origin: tagnames_dict_jq_to_origin,
                tagnames_dict_origin_to_jq: tagnames_dict_origin_to_jq
            }

        } //function clean_xhtml_v2
    ,

    // a clone or deep copy of the original 
    clone_original:
        function clone_original(original) {
            let cloned = original;
            return cloned
        }
    ,

    replace_with_mark:
        function replace_with_mark(thestr, originalchars, maskcat, maskprefix = '__', masksuffix = '__', debug = 0) {
            let UUID = require('uuid')

            let _arr = thestr.split(originalchars)
            let masks_dict = {}
            let maskedstr = ""
            _arr.forEach((d, i) => {
                let uuid = UUID.v4()
                if (debug === 1) { console.log(maskprefix, masksuffix) }
                let maskstr = `${maskprefix}${uuid}${masksuffix}`
                masks_dict[uuid] = { maskstr: maskstr, original: originalchars, maskcat: maskcat }
                if (i < _arr.length - 1) {
                    maskedstr = `${maskedstr}${d}${maskstr}`
                } else {
                    maskedstr = `${maskedstr}${d}`
                }// if i
            }) // for each
            let tmpdict = { masked: maskedstr, masks: masks_dict }
            if (debug === 1) { console.log(tmpdict) }
            return tmpdict
        } // function ...
    ,

    get_tagnames_origin:
        function get_tagnames_origin(thestr) {
            // let patterns_arr = ['\<[!\\]?\>', '\<\/(.*)\>', '\<(.*)\/\>']
            let tagnames_originalcase_arr = []
            let pattern, re, matched_arr
            pattern = '\<(.*)\>' // like <p>, <strong class=...> <br/>, </p>
            re = new RegExp(pattern, 'g') // 'g' to find all matched instances
            matched_arr = thestr.match(re)
            if (matched_arr) { // if there is nothing matched, matched_arr === NULL
                matched_arr.forEach(matchedstr => { // matchedstr is like '</p>', or '<br/>'
                    if (matchedstr.substring(0, 1) === '<' && matchedstr.substring(1, 2) !== '/') { // like '<p>' or <br/>, not like </p>
                        //remove the first '<'
                        if (matchedstr.substring(0, 1) === '<') { matchedstr = matchedstr.substring(1) }
                        // get the tagname which is the first word 
                        let firstword = matchedstr.split(' ')[0] // like p in 'p class='1 <ok/>', strong> in <strong>, or br/> in '<br/>' 
                        firstword = firstword.split('>')[0] // like strong in 'strong>'
                        let tagname = firstword.split('/')[0] // like br in 'br/>' 
                        // console.log(tagname)
                        if (!tagnames_originalcase_arr.includes(tagname)) { tagnames_originalcase_arr.push(tagname) } // push the tagname into a distinct list of tagnames

                    }
                    else if (matchedstr.substring(0, 2) === '</') { // like '</p>'
                        // get the segement after the LAST </
                        let tmparr = matchedstr.split('</')
                        let seg1 = tmparr[tmparr.length - 1] // like 'p>'
                        // console.log('seg1', seg1)
                        let tagname = seg1.split('>')[0]
                        // console.log(tagname)
                        if (!tagnames_originalcase_arr.includes(tagname)) { tagnames_originalcase_arr.push(tagname) } // push the tagname into a distinct list of tagnames
                    } // if else matchedstr

                }) // matched_arr.forEach
            } //if (matched_arr) not NULL

            return tagnames_originalcase_arr
        } // get_tagnames_origin
    ,

    make_origin_jq_tagnames_dicts:
        function make_origin_jq_tagnames_dicts(original_str, masked_str) {
            let jsdom = require("jsdom");
            let { window } = new jsdom.JSDOM(`...`);
            let $ = require("jquery")(window);

            // console.log(original_str)
            let _jq = $(`<root>${original_str}<root>`)

            let allnodes_jq = _jq.find('*')  // find all tags within the root jq object (children nodes, grandchildren nodes, ... everything)
            tagnames_jq_arr = []
            for (let j = 0; j < allnodes_jq.length; j++) {
                let thedom = allnodes_jq[j]
                if (!tagnames_jq_arr.includes(thedom.tagName)) { tagnames_jq_arr.push(thedom.tagName) }
            } // for (let j=0; j< jq1.length; j++){
            // console.log('tagnames_jq_arr', tagnames_jq_arr)

            let tagnames_originalcase_arr = this.get_tagnames_origin(masked_str)
            // console.log(tagnames_originalcase_arr)

            /* Now that we can compare the tagnames from match() with those from jq. Those by match() but not in tagnames by _jq can be excluded. 
                Note that jq converted all tagnames into uppercase(), which might cause problems. 
                For example, in my project sas_egp_v8tov7, the tagnames must follow the original case form (e.g., ProjectCollection, not PROJECTCOLLECTION) otherwise the converted xml won't be recoginzed by SAS
                To allow keeping the original case form, we'll construct dictionaries mapping the original and the converted tagnames
                We'll keep it in two ways: mapping jq converted tagnames to original (e.g., MYTAG to MyTag), as well as original tagnames to jq converted (e.g., mYtag to MYTAG, MyTag to MYTAG) 
            */
            tagnames_dict_jq_to_origin = {}
            tagnames_dict_origin_to_jq = {}
            tagnames_originalcase_arr.forEach(tagnames_originalcase => {
                if (tagnames_jq_arr.includes(tagnames_originalcase.toUpperCase())) {
                    tagnames_dict_jq_to_origin[tagnames_originalcase.toUpperCase()] = tagnames_originalcase
                    tagnames_dict_origin_to_jq[tagnames_originalcase] = tagnames_originalcase.toUpperCase()
                }
            })
            // console.log(tagnames_dict_jq_to_origin, tagnames_dict_origin_to_jq)
            /* what if the same tagname has different original form (e.g., mYtag, and MyTag) and one wants to map the jq converted tagnames to the origin? 
                the above algorithm can only map the coverted to the case form of the last matched original tagname (e.g., MYTAG to MyTag). 
                Well, we can have a more sophisticated solution:
                    Each converted tag is remembered individually, with character positions (offsets, [start, end]) of the tagnames in the converted, and original text. 
                    e.g., for the first converted tagname MYTAG, we'll make it like:
                    {uuid:"xxxx-xxxx...", converted: "MYTAG", offsets_converted: "xx, xx", offsets_original:"yy,yy"}
                    for the second coverted tagname MYTAG, a different reord with differnt offset postions. 
                However, I doubt if it is necessary.
                If the tagnames has different case forms, most likely the case form does not matter in the original application. 
                I'll leave that complex solution out here. 
            */
            return { tagnames_originalcase_arr: tagnames_originalcase_arr, tagnames_dict_jq_to_origin: tagnames_dict_jq_to_origin, tagnames_dict_origin_to_jq: tagnames_dict_origin_to_jq }
        } // make_origin_jq_tagnames_dicts()
    ,

    remove_masks:
        function remove_masks(thestr, masks_dict, maskcat = 'original line break') {
            // console.log('masks_dict', masks_dict)
            // loop for all keys ()mask ids appear in the masked text  of masks_dict
            let maskids_arr = Object.keys(masks_dict)
            maskids_arr.forEach(id => {
                let mask_dict = masks_dict[id]
                if (mask_dict['maskcat'] === maskcat) {
                    // console.log(mask_dict)
                    let pattern = mask_dict['maskstr']
                    let re = new RegExp(pattern, 'g')
                    thestr = thestr.replace(re, mask_dict['original'])
                } //if (mask_dict['maskcat']=== 'tag line break')
            })
            return thestr
        } // remove_tag_line_breaks(str, masks_dict)
    ,

    convertSelfClosingHTML_to_OldSchoolHTML:
        function convertSelfClosingHTML_to_OldSchoolHTML(thestr) {
            let matched_arr = thestr.match(/\<(.*)\/\>/)
            // console.log('324', matched_arr.length)
            if (matched_arr && matched_arr.length > 0) {
                let seg1 = matched_arr[1].split('<')
                // sometimes the lastmatchedstr is like GitSourceControl GUID="x2K5fW8CFtZy3Ke7"
                // in that case, the part after the first whitespace (GUID="x2K5fW8CFtZy3Ke7") should be excluded 
                let theLastMatchedStr = seg1[seg1.length - 1]
                // console.log(theLastMatchedStr)
                let theLastMatchedStr_tagName = theLastMatchedStr.split(' ')[0]
                // console.log(theLastMatchedStr_tagName)
                // replace <Others /> with <Others></Others>
                let xhtmlstr = "<" + theLastMatchedStr + "/>"
                let htmlstr = "<" + theLastMatchedStr + ">" + "</" + theLastMatchedStr_tagName + ">"
                thestr = thestr.replace(xhtmlstr, htmlstr)
                let matched_arr2 = thestr.match(/\<(.*)\/\>/)
                if (matched_arr2 && matched_arr2.length > 0) {
                    thestr = convertSelfClosingHTML_to_OldSchoolHTML(thestr)
                }
            }
            return thestr
        } // function convertSelfClosingHTML_to_OldSchoolHTML(str...
    ,

    remove_comments:
        function remove_comments(thestr) {
            let result = ''
            // split str by '<!--'
            let segments = thestr.split('<!--')
            for (let i = 0; i < segments.length; i++) {
                if (segments[i].includes('-->')) {
                    let theSeg = segments[i].split('-->')[1]
                    result = result + theSeg
                } else {
                    result = result + segments[i]
                }
            }
            return result
        } //function remove_comments
    ,

    remove_empty_lines:
        function remove_empty_lines(thestr) {
            let resultstr = ""
            let _arr = thestr.split('\n')
            _arr.forEach(d => {
                if (d.trim().length > 0) {
                    resultstr = `${resultstr}${d}\n`
                }
            })
            return resultstr
        } //remove_empty_lines(thestr)
    ,

    // get a dict of path, name, and extention name of a file
    // Note: the full path string of the file must be give as String.raw``
    // let filename_with_path = String.raw`data\in\prototype\__xml/egpv7\__egtask_example.xml`
    get_file_name:
        function get_file_name(filename_with_path) {
            // console.log(filename_with_path)
            // convert backslash to slash
            filename_with_path = filename_with_path.replace(/\\/g, '/')
            // console.log(10, filename_with_path)
            let startpos_slash = filename_with_path.lastIndexOf('/')
            let filename_with_ext = filename_with_path.substr(startpos_slash + 1)
            let startpos_dot = filename_with_ext.lastIndexOf('.')
            let path = filename_with_path.substring(0, startpos_slash)
            let name = filename_with_ext.substring(0, startpos_dot)
            let ext = filename_with_ext.substr(startpos_dot + 1)
            return { path: path, name: name, ext: ext }
        }, // function get_filename(filename_with_path)

    // get the textContent of the top level of the dom (not including inner text of its children)
    get_dom_toplevel_text:
        //function to remove it's children
        function get_dom_toplevel_text(theDom) {

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