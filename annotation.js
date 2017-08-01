/*
	@Annotation(
		DATA[query=""<required>,column=""<opcional>,type=""<opcional>,sufix=""<string for sufix>,dir=""<BIND_IN{default},BIND_OUT,BIND_INOUT>]
	)
	@type{class,number,integer(remove all outher caracterer),date,boolean,string}
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
        if (!_self) {
            return;
        }
        var self = _self;
        var level = _level;
        var keyObjArray = _keyObjArray || new Array();
        var words = self.constructor.toString();
        var annotations = words.replace(/\s|\*|\//g, "").match(/@Annotation(\S|\s)*?;/g);
        if (!annotations) {
            return;
        }
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
                try {
                    var annotationsType = /\(((\S)*?)\]\)/g.exec(value)[1].split("],");
                } catch (e) {
                    console.error("Annotation Format Error: \n\tClass: %s\n\tAtribute: %s\n\tAnnotation Body: ", self.constructor.name, keyObj, value);
                    throw e;
                }
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
        var annotationsParamns = _annotationsParamns.map(function (item, index) {
            return (index % 3 === 0) ? item.toLowerCase() : item
        });
        var keySufix = annotationsParamns.indexOf('sufix=');
        if (keySufix !== -1) {
            sufix = _sufix + annotationsParamns[keySufix + 1].replace(/\"/g, "");
        }
        for (var key in annotationsParamns) {
            key = parseInt(key);
            var keyObj = null;
            if (annotationsParamns.hasOwnProperty(key) && key % 3 === 0) {
                keyObj = annotationsParamns[key].replace("=", "").toLowerCase();
                try {
                    object[keyObj] = annotationsParamns[key + 1].replace(/\"/g, "") + sufix;
                } catch (e) {
                    console.error("Annotation Format Error: \nClass: %s\nText: %s",
                        self.constructor.name,
                        annotationsParamns.join(''));
                    throw e;
                }
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
                        return '"' + value.replace(/(\n)/g, '\\n') + '"';
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
                        return '"' + value.replace(/(\n)/g, '\\n') + '"';
                    case "boolean":
                        return (value == 'true' || value == '1') ? true : false;
                    case "number":
                        value = value ? value : 0;
                        return (parseFloat(value)) ? parseFloat(value) : value;
                    case "integer":
                        if (typeof value == 'string') {
                            value = value.replace(/\D/g, '');
                            value = value ? value : 0;
                        }
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
                        value = value ? value : 0;
                        return parseFloat(value);
                    case "integer":
                        if (typeof value == 'string') {
                            value = value.replace(/\D/g, '');
                            value = value ? value : 0;
                        }
                        return (parseFloat(value)) ? parseFloat(value) : value;
                    case "date":
                        return new Date(value);
                    case "boolean":
                        return (value == 'true' || value == '1') ? true : false;
                    default:
                        return value.toString();
                }
            }
            objects.getValueTypeForSQL = function (value, type) {
                if (value === null || value === undefined) {
                    return null;
                }
                switch (type) {
                    case "number":
                        value = value ? value : 0;
                        return parseFloat(value);
                    case "integer":
                        if (typeof value == 'string') {
                            value = value.replace(/\D/g, '');
                            value = value ? value : 0;
                        }
                        return (parseFloat(value)) ? parseFloat(value) : value;
                    case "date":
                        if (value instanceof Date) {
                            return "TO_DATE('" + value.toISOString().split('T').join(' ').split('.')[0] + "', 'YYYY-MM-DD HH24:MI:SS')";
                        } else {
                            return "TO_DATE('" + value.toString() + "', 'YYYY-MM-DD')";
                        }
                    case "boolean":
                        return (value == 'true' || value == '1') ? 1 : 0;
                    default:
                        return "'" + value.toString() + "'";
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


global.populateToService = (_variable, _req, _reqType, _mainAnnotation, _annotationParam, _maxLevel = 2, _stringConcat = "") => {
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
    try {
        eval(string);
    } catch (error) {
        throw error;
    }

}

/* -------------------------------- POPULATE TO PERSISTENCE --------------------------------  */

global.populateToPersistence = (_variable, _mainAnnotation, _nameVariable, _annotationParam, _maxLevel = 2, _stringConcat = "") => {
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

/* -------------------------------- GENERATE SQL ANSI --------------------------------  */

global.generateSQL = (_variable, _typeSQL = '', _tableName = '', _where = '', _mainAnnotation, _annotationParam, _maxLevel = 2) => {
    var object = _variable.getAnnotations(_mainAnnotation, _maxLevel);
    var nameAnnotation = _annotationParam;
    var sql = '';

    var generateINSERT = () => {
        sql += "INSERT INTO " + _tableName + " ( ";
        for (var key in object) {
            if (object.hasOwnProperty(key) && typeof object[key] !== "function") {
                if (object[key][nameAnnotation]) {
                    var value = eval("_variable." + key);
                    if (value || value === 0) {
                        sql += object[key][nameAnnotation] + ',';
                    }
                }
            }
        }
        sql = sql.slice(0, -1);
        sql += " ) VALUES ( ";
        for (var key in object) {
            if (object.hasOwnProperty(key) && typeof object[key] !== "function") {
                if (object[key][nameAnnotation]) {
                    var value = eval("_variable." + key);
                    if (value || value === 0) {
                        sql += object.getValueTypeForSQL(value, object[key].type) + ',';
                    }
                }
            }
        }
        sql = sql.slice(0, -1);
        sql += " )";
        return sql;
    };

    var generateUPDATE = () => {
        sql += "UPDATE " + _tableName + " SET  ";
        for (var key in object) {
            if (object.hasOwnProperty(key) && typeof object[key] !== "function") {
                if (object[key][nameAnnotation]) {
                    var value = eval("_variable." + key);
                    if (value || value === 0) {
                        sql += ' ' + object[key][nameAnnotation] + ' = ' + object.getValueTypeForSQL(value, object[key].type) + ',';
                    }
                }
            }
        }
        sql = sql.slice(0, -1);
        sql += ' WHERE ' + _where;
        return sql;
    };

    switch (_typeSQL.trim().toUpperCase()) {
        case 'INSERT':
            return generateINSERT();
        case 'UPDATE':
            return generateUPDATE();
        default:
            return sql;
    }
};