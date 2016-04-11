#!/usr/bin/node

/*

Informações sobre a consulta
url: https://iosearch.reclameaqui.com.br/raichu-io-site-search-0.0.1-SNAPSHOT/complains
parâmetros de entrada e alguns valores de exemplo:
  - index=0
  - offset=1000
  - order=created
  - orderType=desc
  - fields=id, created, status, title, description, evaluation, evaluated, solved, 
           score, hasReply, dealAgain, compliment, userState, userCity
  - company=103
  - status=ANSWERED
  - evaluated=bool:true
  - solved=bool:true
  - deleted=bool:false
exemplos de campos:
  id, created, status, title, description, evaluation, evaluated, solved, score, hasReply, dealAgain, 
  compliment, userState, userCity, interactions, firstInteractionDate, complainOrigin, modified.
retorna um objeto com o atributou count (total de registros) e data (array de objetos contendo os campos selecionados)

*/

var Client = require('node-rest-client').Client;
var client = new Client();
var offset = "100"; //INDICAR AQUI QUANTOS REGISTROS VAI LER
var args = { path: { index: "0", 
                          offset: offset, 
                          order: "created", 
                          orderType: "desc",
                          fields: "id,created,status,title,description,evaluation,evaluated,solved,score,hasReply,dealAgain,compliment,userState,userCity",
                          company: "103",
                          deleted: "bool:false"
                        }
};
client.registerMethod("getComplaints", "https://iosearch.reclameaqui.com.br/raichu-io-site-search-0.0.1-SNAPSHOT/complains?index=${index}&offset=${offset}&order=${order}&orderType=${orderType}&fields=${fields}&company=${company}&deleted=${deleted}", "GET");
client.methods.getComplaints(args, function (reclamacoes, resposta) {
  console.log(reclamacoes.data);
  console.log(reclamacoes.data.length);
  console.log(reclamacoes.count);
  for(var i = 0; i < reclamacoes.data.length; i++) {
    //tweaks to store data in cloudant
      reclamacoes.data[i]._id  = "r" + reclamacoes.data[i].id;
    //reclamacoes.data[i]._rev  = String(Math.floor(new Date() / 1000));
  }
  console.log(reclamacoes.data);

});






 