'use strict'
const app = require('../src/app'); /* diretorio do app para execução */
const debug = require('debug')('balta:server'); /* debugar a aplicação */
const http = require('http'); /* criar servidor http */

var Spinnies = require("spinnies");

/* chamar router/funcoes responsáveis por retornar notificações */
const notifis = require('../src/routes/wp-route');


/* configurar servidor */ 
 const port = normalizePort(process.env.PORT || "3000"); 
 

const server = http.createServer(app); /* apontar a aplicação no novo servidor criado */
var io = require('socket.io')(server);
/* configurar socket.io */
var spinnies = new Spinnies();
io.on('connection', async (socket) => {

  spinnies.add('server-screen-socket', { text: 'Sistema de notificações, foi requisitando pelo cliente id: '+ socket.id +' rodando...', color: 'blue' });

      /* chamada do cliente para api  -  Cliente ----> API */
      socket.on('getNotification',data => {
        
       // console.log(data);  
          
        
      });

                
      /* envio de notificações server --> cliente */
        setInterval( async function(){

          var rs = await notifis.notificacoes(); 

          spinnies.add('notificacao', { text: 'Executando função de notificação.', color: 'green' });
           //console.log(rs.webhook);           
            if (rs.webhook){
              /* enviar mensagem para todos que estão conectados... */
              socket.emit('receivedMessage',rs); 
              console.log("✍️Uma Notificação de nova mensagem foi enviada.")
             // console.log(rs);
            }else{
             // console.log("🤲Nenhum notificação enviada.")
            }

        },600);

       
});



/* verificar funcionamento */
server.listen(port);
//console.log('Api Rodando na Porta:' + port);
//var spinnies = new Spinnies();
spinnies.add('server-screen', { text: 'Api Rodando na Porta:' + port, color: 'blue' });

/* para verificar portas disponiveis e setar a porta a ser utilizada pelo servidor */
function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }


server.on('error',onError);
/* tratar erros do servidor ou hospedagem - retornar qual tipo de erro */
function onError(error){
    if(error.syscall !== 'listen'){
        throw error;
    }

    const bind = typeof port === 'string' ?
        'Pipe' + port:
        'Port' + port;

        switch (error.code){
            case 'EACCES':
                console.log(bind + ' requer elevação de privilégios.');
                process.exit(1);
                break;
            case  'EADDRINUSE':
                console.error(bind + ' esta em uso.');
                process.exit(1);
                break;
            default:
                throw error;
        }
}
  

exports.comunication = async function(){  return io; };

