/*
	@Annotation(
		DATA[query=""<required>,column=""<opcional>,type=""<opcional>,sufix=""<string for sufix>]
	)
	@type{class,number,date,boolean,string}
    @sufix{<string for sufix>}
*/

JSON.clone = function (value) {
    return JSON.parse(JSON.stringify(value));
}

/* -------------------------------- GET ANNOTATIONS --------------------------------  */

Object.prototype.getAnnotations = function (_typeQueryEnum = "DATA", _maxLevel = 2) {
    var self = this;
    var typeQueryEnum = _typeQueryEnum;
    var objects = {};
    var maxLevel = _maxLevel;

    var getObjects = function (_self, _keyObjArray, _level = 1, _sufix = "") {
        var self = _self;
        var level = _level;
        var keyObjArray = _keyObjArray || new Array();
        var words = self.constructor.toString();
        var annotations = words.replace(/\s|\*|\//g, "").match(/@Annotation(\S|\s)*?;/g);
        if (!annotations) { return; }
        annotations.forEach(function (value, index) {
            value = value.replace(/],\)/g, "])");
            var keyObj = /this.(.*?)(\=)/.exec(value)[1];
            var valueType = /@type.(.*?)(\})/.exec(value);
            if (valueType && valueType.length === 3) {
                valueType = valueType[1].toLowerCase();
            } else {
                valueType = "string";
            }
            var sufix = /@sufix.(.*?)(\})/.exec(value);
            if (sufix && sufix.length === 3) {
                sufix = _sufix + sufix[1];
            } else {
                sufix = _sufix;
            }
            var keyObjArr = JSON.clone(keyObjArray);
            keyObjArr.push(keyObj);
            if (valueType === "class" && level < maxLevel) {
                getObjects(self[keyObj], keyObjArr, level + 1, sufix);
            } else if (valueType !== "class") {
                var annotationsType = /\(((\S)*?)\]\)/g.exec(value)[1].split("],");
                var annotationsParamns = null;
                var objectGenerate = null;
                loop1: for (var key in annotationsType) {
                    if (annotationsType.hasOwnProperty(key) && annotationsType[key].match(typeQueryEnum)) {
                        annotationsParamns = /\[(\S*)/g.exec(annotationsType[key])[1];
                        annotationsParamns = annotationsParamns.match(/(\"(.*?)\")|\,|(\S.*?)\=/g);
                        objectGenerate = objectGeneration(annotationsParamns, _sufix);
                        break loop1;
                    }
                }
                if (objectGenerate) {
                    var keyObjArrJoin = keyObjArr.join(".");
                    objects[keyObjArrJoin] = objectGenerate;
                    if (!objects[keyObjArrJoin].type) {
                        objects[keyObjArrJoin].type = valueType;
                    }
                    if (!objects[keyObjArrJoin].dir) {
                        objects[keyObjArrJoin].dir = "BIND_IN";
                    }
                }
            }
        });
    }

    var objectGeneration = function (_annotationsParamns, _sufix) {
        var object = {};
        var sufix = _sufix;
        var annotationsParamns = _annotationsParamns.map(function (item, index) { return (index % 3 === 0) ? item.toLowerCase() : item });
        var keySufix = annotationsParamns.indexOf('sufix=');
        if (keySufix !== -1) {
            sufix = _sufix + annotationsParamns[keySufix + 1].replace(/\"/g, "");
        }
        for (var key in annotationsParamns) {
            key = parseInt(key);
            var keyObj = null;
            if (annotationsParamns.hasOwnProperty(key) && key % 3 === 0) {
                keyObj = annotationsParamns[key].replace("=", "").toLowerCase();
                object[keyObj] = annotationsParamns[key + 1].replace(/\"/g, "") + sufix;
                if (keyObj === "type") {
                    object[keyObj] = object[keyObj].toLowerCase();
                }
            }
        }
        if (!Object.keys(object).length) {
            return null;
        }
        return object;
    }

    var setMethods = function () {
        if (Object.keys(objects).length) {
            objects.getTypeForEval = function (value, type) {
                var type = type.toLowerCase();
                if (value === null || value === undefined) {
                    return null;
                }
                switch (type) {
                    case "date":
                        return "new Date(" + value.getTime() + ")";
                    case "string":
                        return '"' + value + '"';
                    case "boolean":
                        return (value == 'true' || value == '1') ? true : false;
                    default:
                        return value;
                }
            }
            objects.getValueTypeForEval = function (value, type) {
                if (value === null || value === undefined) {
                    return null;
                }
                switch (type) {
                    case "date":
                        return "new Date('" + value + "')";
                    case "string":
                        return '"' + value + '"';
                    case "boolean":
                        return (value == 'true' || value == '1') ? true : false;
                    case "number":
                        return (parseFloat(value)) ? parseFloat(value) : value;
                    default:
                        return value;
                }
            }
            objects.getValueType = function (value, type) {
                if (value === null || value === undefined) {
                    return null;
                }
                switch (type) {
                    case "number":
                        return parseFloat(value);
                    case "date":
                        return new Date(value);
                    case "boolean":
                        return (value == 'true' || value == '1') ? true : false;
                    default:
                        return value.toString();
                }
            }
        }
    }

    var init = function () {
        getObjects(self);
        setMethods();
        return objects;
    }

    return init();
};


/* -------------------------------- POPULATE TO SERVICE --------------------------------  */

global.populateToService = function (_variable, _req, _reqType, _mainAnnotation, _annotationParam, _maxLevel = 2, _stringConcat = "") {
    var object = _variable.getAnnotations(_mainAnnotation, _maxLevel);
    var nameAnnotation = _annotationParam;
    var stringConcat = _stringConcat;
    var keyArr = [];
    var incrementValue = {};
    var string = "";
    var reqType = _reqType || "query";
    var req = _req;
    for (var key in object) {
        if (object.hasOwnProperty(key) && typeof object[key] !== "function") {
            if (reqType === "body") {
                try {
                    var value = object.getValueTypeForEval(eval("req." + key), object[key].type);
                    eval("_variable." + key + "= " + value);
                } catch (err) {
                    console.error("----\n", err.message, "\n object key: " + key + "\n----\n");
                }
            } else {
                if (keyArr.indexOf(object[key][nameAnnotation]) !== 1) {
                    keyArr.push(object[key][nameAnnotation]);
                }
                if (typeof incrementValue[object[key][nameAnnotation]] === 'undefined') {
                    incrementValue[object[key][nameAnnotation]] = 1;
                } else {
                    incrementValue[object[key][nameAnnotation]]++;
                }
                var value = null;
                var keyJoin = object[key][nameAnnotation] + stringConcat + incrementValue[object[key][nameAnnotation]];
                if (req.hasOwnProperty(object[key][nameAnnotation])) {
                    value = object.getValueTypeForEval(req[object[key][nameAnnotation]], object[key].type);
                    string += "_variable." + key + "=" + value + ";";
                } else if (req.hasOwnProperty(keyJoin)) {
                    value = object.getValueTypeForEval(req[keyJoin], object[key].type);
                    string += "_variable." + key + "=" + value + ";";
                }
            }
        }
    }
    eval(string);
}

/* -------------------------------- POPULATE TO PERSISTENCE --------------------------------  */

global.populateToPersistence = function (_variable, _mainAnnotation, _nameVariable, _annotationParam, _maxLevel = 2, _stringConcat = "") {
    var object = _variable.getAnnotations(_mainAnnotation, _maxLevel);
    var nameMainVariable = _nameVariable;
    var nameAnnotation = _annotationParam;
    var stringConcat = _stringConcat;
    var string = "bindVars = {";
    for (var key in object) {
        if (object.hasOwnProperty(key) && typeof object[key] !== "function") {
            if (object[key][nameAnnotation]) {
                string += "\"" + object[key][nameAnnotation] + "\":{";
                var value = object.getTypeForEval(eval("_variable." + key), object[key].type);
                string += "\"val\":" + value + ",";
                string += "type:oracledb." + object[key].type.toUpperCase() + ",";
                string += "dir:oracledb." + object[key].dir;
                string += "},";
            }
        }
    }
    string += "}";
    string = string.replace(/},}/, "}}");
    return string;
}