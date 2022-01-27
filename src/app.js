'use strict'  
/* link referencias Criando APIs com NodeJs - Aula 10: CRUD REST: https://www.youtube.com/watch?v=FXQ3ZZh5jh4 */

const express = require('express'); /* criar app mvc */
const bodyParser = require('body-parser');
const app = express();
const router = express.Router(); /* navegação web pelos diretorio(link) da aplicação */
var path = require('path');


/* tornar ilimitado eventorListener da memória (para não causar estouro de memoria) */
require('events').EventEmitter.prototype._maxListeners = 0;

/* importar rotas */
/* whatsapp page instanciada */
const wp = require('./routes/wp-route');

/* adicionar body-parser no app, para que toda requisição o result seja convertido para formato json -automaticamente */
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ 
    extended: false,
    limit: '50mb'
}));


/* gerar acesso a pasta public (visualizar arquivos front = imagens) */
var dir = path.join(__dirname + '/../', 'public');
app.use(express.static(dir));

app.post('/wp/getAllContacts', wp.getAllContacts);
app.post('/wp/get_Chat', wp.getChat);
app.post('/wp/createGroup', wp.createGroup);
app.post('/wp/setupParticipantGroup', wp.setupParticipantGroup);
app.post('/wp/setupAdminGroup', wp.setupAdminGroup);
app.post('/wp/get_Groups', wp.getAllGroups); /* todos os grupos da instancia */
app.post('/wp/setGroupChatAction', wp.setGroupChatAction); /* alterar permissão de chat no grupo para demais contatos */
app.post('/wp/setGroupinfo', wp.setupGroupInfo);
app.post('/wp/get_ChatListTransm', wp.getAllListTransm);
app.post('/wp/FormatMsgFiles', wp.FormatMessageFiles); 
app.post('/wp/get_AllMsgs', wp.get_AllMsgs);
app.post('/wp/getProfilePic', wp.getProfilePic);
app.post('/wp/getUnreadMsg', wp.getUnreadMsg);
app.post('/wp/sendMsg', wp.sendMensagem);
app.post('/wp/sendLocation', wp.sendLocation);
app.post('/wp/sendLinkPreview', wp.sendLinkPreview);
app.post('/wp/newMsg', wp.newMsg);
app.post('/wp/SendMedia', wp.sendMsgMedia);
app.post('/wp/qrcode', wp.getQrcode);
app.post('/wp/get_instancias', wp.get_instancias);
app.post('/wp/status', wp.getStatus);
app.post('/wp/set_OnAgora',wp.set_OnAgora);
app.post('/wp/check_number',wp.check_number);
app.post('/wp/logoff', wp.logoff);
/* notificar */
//app.post('/wp/notificacoes',wp.emitir);

/* chamadas http-pages - front */
app.get('/',wp.front);

/* funções de INTEGRAÇÕES - ISP controlls */
app.get('/wp/IspMsg', wp.IspControllsMsg);

/* integração SGP */
app.get('/wp/msgSgp',wp.msgSgp);


/* exportar -- poder usar em outro arquivo ou modulo */
module.exports = app;
