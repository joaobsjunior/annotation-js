# annotation-js

Módulo para anotação em Javascript.

Modelo da anotação:
```javascript
/*
@Annotation(
DATA[query=""<required>,column=""<opcional>,type=""<opcional>,sufix=""<string for sufix>,dir=""<BIND_IN{default},BIND_OUT,BIND_INOUT>]
)
@type{class,number,date,boolean,string}
@sufix{<string for sufix>}
*/
```

Exemplo de uso:

 - Adicionar as notações nas classes:
 
```javascript
class Contact {
    constructor(email = null, phone = null, age = null) {
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_email"],
            ANNOTATION_NAME_2[informationName="param_email_2"],
        )
        @type{string}
        */
        this.email = email;
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_phone"],
            ANNOTATION_NAME_2[informationName="param_phone_2"],
        )
        @type{string}
        */
        this.phone = phone;
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_age"],
            ANNOTATION_NAME_2[informationName="param_age_2"],
        )
        @type{number}
        */
        this.age = age;
    }
}
class OutherData {
    constructor(id = null, description = null) {
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_id",dir:"BIND_INOUT"],
            ANNOTATION_NAME_2[informationName="param_id_2"],
        )
        @type{number}
        */
        this.id = id;
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_description"],
            ANNOTATION_NAME_2[informationName="param_description_2"],
        )
        @type{string}
        */
        this.description = description;
    }
}
class User {
    constructor() {
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_name"],
            ANNOTATION_NAME_2[informationName="param_name_2"],
        )
        @type{string}
        */
        this.name = 'João';
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_is_dev"],
            ANNOTATION_NAME_2[informationName="param_is_dev_2"],
        )
        @type{boolean}
        */
        this.isDeveloper = true;
        /*
        @Annotation(
            ANNOTATION_NAME_1[informationName="param_date_created"],
            ANNOTATION_NAME_2[informationName="param_date_created_2"],
        )
        @type{date}
        */
        this.dateCreated = new Date('2017-03-23');
        /*
        @Annotation()
        @type{class}
        */
        this.contact = new Contact('joaojunior.mail@gmail.com', '99 9999-9999', 29);
        /*
        @Annotation()
        @type{class}
        @sufix{_1}
        */
        this.data1 = new OutherData(10, 'Teste1');
        /*
        @Annotation()
        @type{class}
        @sufix{_2}
        */
        this.data2 = new OutherData(20, 'Teste2');
    }
}
```
 - Método para leitura de notação (genérico):

```javascript
User.getAnnotations(<name_annotation{string}>,<max_level{integer}>);
```
Exemplo:
```javascript
var annotation = User.getAnnotations('ANNOTATION_NAME_1',2);
```
 - Método para leitura de notação (popular dados em objeto através de um array):
```javascript
global.populateToService(<variable{any}>, <json{object}>, <type_array{string(query,body)}>,<name_annotation{string}>, <information_name{string}>,<max_level{integer}>);
```
Exemplo:
```javascript
var user = new User();
global.populateToService(user, {param_date_created:new Date(),param_name:'John'}, "query", "ANNOTATION_NAME_1", "informationName", 2);
```
 - Método para leitura de notação para bindVars do módulo ```npm oracledb```:
```javascript
global.populateToPersistence(<variable{any}>, <name_annotation{string}>, <variable_name{string}>,<information_name{string}>,<max_level{integer}>);
```
Exemplo:
```javascript
var bindVars = null;
var stringToEval = global.populateToPersistence(user, "ANNOTATION_NAME_1", "user", "informationName", 3);
eval(stringToEval);
bindVars = Object.assign({}, bindVars, {
      cursor: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 2}
    });
```
 - Método geração de SQL genérico (INSERT,UPDATE):
```javascript
global.generateSQL(<variable{any}>, <typeSQL{string(INSERT,UPDATE)}>, <table_name{string}>, <where{string}>,<name_annotation{string}>, <information_name{string}>,<max_level{integer}>);
```
Exemplo:
```javascript
var sql = global.generateSQL(user, "UPDATE", "TB_CLIENT", "id = 1", "ANNOTATION_NAME_1", "informationName", 3);
console.log(sql);
```