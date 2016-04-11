/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), fs = require('fs');

var app = express();
var db;
var cloudant;
var fileToUpload;
var dbCredentials = {
	dbName : 'reclamacoes'
};
var Client = require('node-rest-client').Client;

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		// Pattern match to find the first instance of a Cloudant service in
		// VCAP_SERVICES. If you know your service key, you can access the
		// service credentials directly by using the vcapServices object.
		for(var vcapService in vcapServices){
			if(vcapService.match(/cloudant/i)){
				dbCredentials.host = vcapServices[vcapService][0].credentials.host;
				dbCredentials.port = vcapServices[vcapService][0].credentials.port;
				dbCredentials.user = vcapServices[vcapService][0].credentials.username;
				dbCredentials.password = vcapServices[vcapService][0].credentials.password;
				dbCredentials.url = vcapServices[vcapService][0].credentials.url;
				
				cloudant = require('cloudant')(dbCredentials.url);
				
				// check if DB exists if not create
				cloudant.db.create(dbCredentials.dbName, function (err, res) {
					if (err) { console.log('could not create db ', err); }
				});
				
				db = cloudant.use(dbCredentials.dbName);
				break;
			}
		}
		if(db==null){
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		// For running this app locally you can get your Cloudant credentials 
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment 
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a 
		// Bluemix service.
		//dbCredentials.host = "REPLACE ME";
		//dbCredentials.port = REPLACE ME;
		//dbCredentials.user = "REPLACE ME";
		//dbCredentials.password = "REPLACE ME";
		//dbCredentials.url = "REPLACE ME";
	}
}

initDBConnection();

app.get('/', routes.index);

app.get('/load', function(request, response) {
	console.log("Load Invoked..");	
	var client = new Client();
	var args = { path: { index: "0", 
	                          offset: "2", //INDICAR AQUI QUANTOS REGISTROS VAI LER
	                          order: "created", 
	                          orderType: "desc",
	                          fields: "id,created,status,title,description,evaluation,evaluated,solved,score,hasReply,dealAgain,compliment,userState,userCity",
	                          company: "103",
	                          deleted: "bool:false"
	                        }
	};
	client.registerMethod("getComplaints", "https://iosearch.reclameaqui.com.br/raichu-io-site-search-0.0.1-SNAPSHOT/complains?index=${index}&offset=${offset}&order=${order}&orderType=${orderType}&fields=${fields}&company=${company}&deleted=${deleted}", "GET");
	client.methods.getComplaints(args, function (jsonarray, responsebody) {
	  	console.log('Total de registros da consulta:'+jsonarray.count);
	  	console.log('Total de registros lidos:'+jsonarray.data.length);
		  for(var i = 0; i < jsonarray.data.length; i++) {
		    jsonarray.data[i]._id  = jsonarray.data[i].id;
		    //jsonarray.data[i]._rev  = "pc" + String(Math.floor(new Date() / 1000));

		  }
		bulkSave(jsonarray.data, response);
	});
});

var bulkSave = function(jsonarray, response) {	
	db.bulk({
		docs : jsonarray
	}, function(err, doc) {
				if(err) {
					console.log('Erro inserindo dados\n'+err);
					response.sendStatus(500);
					response.end();
					return 500;
				} else {
					console.log('Dados inseridos com sucesso\n');
					response.sendStatus(200);
					response.end();
					return 200;
				}
	});
}

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
	console.log('Express server listening on port ' + app.get('port'));
});

