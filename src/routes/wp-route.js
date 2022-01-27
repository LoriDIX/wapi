
var wapi_srv = require('@wppconnect-team/wppconnect');
const fs = require('fs');
var mime = require('mime-types');
var confApi = require('../../config/api');
var cBrowser = require('../../config/browser'); /* configs para o browser */
var utils = require('../controllers/utilsWp_controller');
var wpCtr = require('../controllers/wp_controller');
const ctrFile = require('../controllers/Files_controller');
var request = require('request'); /* enviar post -> php */
var extend = require('extend'); /* extender objects */



const { response } = require('../app');


/* variaveis globais */
var qrcode;
var instancias = []; /* {'name':'vendas','instancia':client} */
var statusAcumulate = [] /* armazenar status conexao (detectar laço infinito sessao) */
/* config drive chromium */
/* config timeout in line: 76 arquive: wapi_srv20\node_modules\wapi_srv\dist\controllers\browser.js */
/* configs venom */


/* função instancias */
async function setup_instancia(instancia,session_rem){
  var consulta = {'flag_exist':false,'instancia':undefined};
 
  /*
  async () => {
      const marketingClient = await wapi_srv.create('marketing');
      const salesClient = await wapi_srv.create('sales');
      const supportClient = await wapi_srv.create('support');
    };
  */

     /* remover cache da sessao anterior */
     if(session_rem == true){

      await wpCtr.remove_caches(instancia);

    }


   /* verificar se instancia solicitada já existe */
  consulta = await verify_instance(instancia);
  

      if(consulta.flag_exist == false){

          /* criar object instancia com status de aguardando qrcode (UNPAIRED) */
          instancias.push({'name':instancia,'qrcode':qrcode,'status':'UNPAIRED','instancia':undefined,'webhook':{}});         

        /* formatar e construir a instancia */
       var setIntance = {};
       extend(setIntance,cBrowser.configs);
       setIntance.session = instancia;
         // fs.rmdirSync(path, { recursive: true });
        // wapi_srv.defaultLogger.level = 'silly'; /* logs da api */
         wapi_srv.create(setIntance, (base64Qr, asciiQR, attempts, urlCode) => {      
           
         
              /* atualizar qrcode */
              instancias.forEach( async function(item){
                /* VARRER O OBJECT DA INSTANCIA CRIADA E GRAVAR O QRCODE NA RESPECTIVA INSTANCIA */
                if(item.name == instancia){  
                 
                 // console.log(configs);
                  /* verificar as configurações para API */
                  if(confApi.files.return_patch_files == true){

                      var dirDestFile = __dirname + "/../../public/files/wapi/qrcodes/" + item.name + ".png";
                      fileExportQR(base64Qr,dirDestFile);

                      item.qrcode = "files/wapi/qrcodes/" + item.name + ".png";
                      item.status = "UNPAIRED";

                  }else{

                      /* atualizar o qrcode (base64) */
                      item.qrcode = base64Qr;
                      item.status = "UNPAIRED";

                  }
                 
                  return;
                }

              });

            

         
        }, async (statusSession, session_name) => {

          /* TRATAR STATUS DA SESSÕES */

              console.log('- Status da sessão:', statusSession);
              //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
              //Create session wss return "serverClose" case server for close
              console.log('- Session name: ', session_name);

              for(var i =0;i < instancias.length; i++){

                    if(instancias[i].name == session_name){
                     
                      
                          if (statusSession == 'isLogged' || statusSession == 'inChat') {

                            instancias[i].qrcode = "syncronized";
                            instancias[i].status = true;

                          } else if (statusSession == 'qrReadSuccess') {

                            instancias[i].qrcode = "syncronized";
                            instancias[i].status = true;

                          } else if (statusSession == 'qrReadFail' || statusSession == 'notLogged') {

                           // instancias[i].qrcode = "UNPAIRED";
                            //instancias[i].status = false;

                          }else if(statusSession == 'autocloseCalled'){ /* timer para que o cliente syncronize o qrcode (expirar) */
                              console.log("❌Sessão autocancelada, removendo sessão.")                           
       
                              if(instancias[i].name == session_name){
                                instancias.splice(i, 1);
                                console.log("✅Sessão removida com sucesso.");
                                break;                                                                  
                              }
                      
                            //instancias[i].qrcode = statusSession;
                            //instancias[i].status = "false";
                          }else if(statusSession == 'desconnectedMobile'){

                            /* se desconectar através do aparelho remover o arquivo do cache da sessão. */
                            await setup_status_action(statusSession,'destroy',instancias[i].intancia);

                          }else if(statusSession == 'OPENING'){

                              /* armazenar status */
                              statusAcumulate.push({statusSession:+1})

                              /* sequencia de status oscilar entre OPENING E PAIRING MAS DE UM VEZ, ESTÁ EM LOOG */
                              for(var Y =0;Y < statusAcumulate.length; Y++){

                                if(statusAcumulate[Y].OPENING > 0 && statusAcumulate[Y].PAIRING > 0){
                                  console.log("❌❕ Dados da Instancia Travada: ------------->",instancias[i].intancia)
                                  await setup_status_action(statusSession,'destroy',instancias[i].intancia);

                                }

                              }



                          }

                    }

              }/* fim do laço */
             

        }).then(async function(client){


            /* gravar a instancia na variavel global após qrcode Sincronizado */
            instancias.forEach(function(item){

              if(item.name == instancia){
  
                /* atualizar o qrcode */
                item.qrcode = "syncronized";
                item.status = true;
                item.instancia = client;
               // client.close();
               
  
              }
  
            });

        // console.log(client.page);
          
          //client.sendText('5516997141457@c.us', '👋 Hello from wapi_srv!');
         
          /* retornar status e formular object instancias */
          client.onStateChange( async (state) => {
           
            // console.log(state); /* status */
             status = state;
            console.log("STATUS:", state)

             if(state == 'UNPAIRED'){

                console.log("Removendo a sessão agora....");
                await setup_status_action(state,'destroy',client);

             }else{

              /* qualquer outros status forçar a reconexão caso, haja perda. */
              await setup_status_action(state,'forceOn',client);

             }
                    
              
 
             
           });

           /* ouvir mensagens (tempo real conforme recebe mensagens) */
         //  console.log(client.onMessage());
          client.onAnyMessage(message => {

            /* identificar se é registro de atualização de status (do whatsapp) */
            if (message.broadcast){
              return; /* não fazer nada */
            } 


            /* enviar mensagem aqui vc faz assim: */
           /// client.sendText(message.from, '🙌🙌 Enviando mensagem de teste...')
           // console.log(message);
            if (message.fromMe == false || confApi.send_post_php.sendForMe == true && message.fromMe == true){  /* não enviada pela sessão ativa */
            
              /* gravar novas mensagens no hook da instancia */
              instancias.forEach( async function(item){

                  if(item.instancia == client){


                      if(message){
                          /* nova mensagen */
                         item.webhook = message; 

                        
                        // console.log("Nova Mensagem armazenada!" + message.body);
                         /* verificar se a mensagem é um arquivo */
                         

                           /* apos formatar o formato do retorno do arquivo (arquivo ou base64) então enviar post de notificação ao sistema client */
                          if(confApi.send_post_php.active == true){                        
                        
                            
                              console.log("✅ Enviando o post para o sistema cliente...");

                               /* descriptofrafar arquivo da mensagem */
                              var msgFormated = {};  
                              var retorno = null;
                                                
                              if(confApi.files.decript_file_chat == true && message.type !== "chat" && message.fromMe == false){

                                    retorno = await utils.formatReceivedFile(item.instancia,message).catch( await function(res){
                                      
                                      console.log("Resultado do retorno de processamento de arquivo do chat: ",res)
                                      return res.retorno;

                                  });
                              }

                              if(retorno){
                                /* mensagem contendo o arquivo descriptografado */
                                msgFormated = retorno;
                              }else{
                                msgFormated = message;
                              }

                            //  console.log(msgFormated);
                                /* enviar object new msg para sistema php via post */
                              await send_post({'instancia':item.name,'msg':msgFormated},"newMsg");
                              
                              /* setar mensagem como lida (sim ou não) */
                              if(confApi.send_post_php.sendSeen == true){
                                  /* após enviar o post marcar mensagens do remetente como lidas */
                                  await client.sendSeen(message.from);

                              }

                          }

                      }
                      
                     
                  } /* varrer mensaem recebida e salvar arquivo de download dentro da pasta public/files */
                
    
              });

            }
            //console.log(instancias);
            
                      
          });  

          /* retorna status da mensagem; lida, não lida etc... (Ouça as mudanças de estado) */
          client.onAck(ack => {

            /* Listen to ack's
             Veja o status da mensagem quando enviada.
             Ao receber o objeto de confirmação, "ack" pode retornar um número, procure os detalhes em {@link AckType}:
             -7 = MD_DOWNGRADE,
             -6 = INACTIVE,
             -5 = CONTENT_UNUPLOADABLE,
             -4 = CONTENT_TOO_BIG,
             -3 = CONTENT_GONE,
             -2 = EXPIRED,
             -1 = FAILED,
              0 = CLOCK,
              1 = SENT,
              2 = RECEIVED,
              3 = READ,
              4 = PLAYED = */
            
              //console.log("👍 Ação da mensagem: ",ack);

              instancias.forEach( async function(item){


                  if(item.instancia == client){
                      /* verificar se o client vai receber dados de status da mensagem via endpoint */
                      if(confApi.send_action_message.active == true){

                            /* enviar object new msg para sistema php via post */
                            await send_post({'instancia':item.name,'StatusMsg':ack},"StatusMsg");

                      }

                  }


              });

          });
          

        /* receber notificações de mensagens */
        client.onNotificationMessage( notify => {

             // console.log("✅Notificando sobre ações de mensagens: ",notifcation);

              /* notificar chamada não atendida (voz) */
              if(notify.type == "call_log" && notify.subtype == 'miss'){

                instancias.forEach( async function(item){

                    if(item.instancia == client){
                        /* verificar se o client vai receber dados de status da mensagem via endpoint */
                        if(confApi.send_notify_msg.active == true){

                              /* enviar object notificaçãoes de mensagen ou chamada de voz (perdida) */
                              await send_post({'instancia':item.name,'notify':notify},"notifyMsg");

                        }

                    }

                });


              }

        })
         
         /* após sincronizar reiniciazar object consulta de instancia */
         consulta = {'flag_exist':false,'instancia':undefined};
         
        
        }).catch((error) => console.log("❌❕ Erro ao gerar o Client: ",error)
        
        
        );

    }


}

/* verificar se instancia existe */
 async function verify_instance(instancia){

    var retorno = {'flag_exist':false,'instancia':undefined};

      /* verificar se instancia solicitada já existe e retornar a mesma */      
      instancias.forEach( async function(item){ 
       
        if(item.name == instancia){          
          console.log('✍️Verificando se existe a instancia: ' + item.name + " status: " + item.status);          

          retorno.flag_exist = true
          retorno.instancia = item.instancia; /* instancia criada no wapi */
          retorno.hook = item.webhook; /* ultima mensagen recebida */
        }       
      
    }); 

    // console.log(retorno);
    return retorno;   
}





/*  controle de ação quando:   *************>>>> quando usuario entrar em outro local (status: CONFLIT) e/ou sair da sessao pelo celular (UNAPIRED E UNPAIRED_IDLE)  */
async function setup_status_action(state,action,client){
              var res = false;


              console.log("O status atual é: " + state);
     // client.forceRefocus();
               /* se o usuário encerrar a sessão pelo celular (whatsapp) então definir as variáveis globais como usuário desconectado */
               for(var i =0;i < instancias.length; i++){
               
                if(instancias[i].instancia == client){

                  if(state == "CONNECTED"){

                    instancias[i].flag_exist = true;
                    instancias[i].qrcode = 'syncronized';
                    instancias[i].status = true;

                  }

               
                 
                  if (state == "UNPAIRED" || state == "desconnectedMobile"){                   

                   /* remover instancia desconectada pelo usuário no smartphone */
                    if(instancias[i].instancia){

                            if(action !== 'forceOn'){

                                try{
                                  instancias[i].flag_exist = true;
                                  instancias[i].qrcode = 'UNPAIRED';
                                  instancias[i].status = false;
                                 
                                  console.log("⛔️ Removendo sessão desconectada ao smartphone...");
                                  process.on('SIGINT', function() {
                                    instancias[i].instancia.close();
                                  }) 
                                  console.log("❌ Usuário desconectou/removeu a sessão, despareando a instancia do cliente..." + instancias[i].name);
                                  await wpCtr.remove_caches(instancias[i].name);
                                  //instancias.splice(i, 0);                                  
                                  return;
                                  // instancias[i].instancia = undefined;
                                }catch(err){

                                  console.log('🛑 Erro: Ao fechar a instancia!' + err);
                                  break;
                                }
                       
                               

                            }else if(action == 'forceOn'){

                             
                                console.log(" (UNPAIRED) reconectando a sessão!!");
                               
                                await instancias[i].instancia.useHere();
                              

                            }
                        // instancias.splice(i, 0); /* remover item (instancia) */
                     
                    
                   }
                    
                                      
                  }

                  if(state == 'UNPAIRED_IDLE'){
                        console.log("⚠️ -----> A sessão está despareado temporariamente!");

                      /*  if(action == 'forceOn'){
                            
                              console.log(state);
                             
                                console.log(" (CONEXÃO PERDIDA) reconectando a sessão!!");                              
                                await instancias[i].instancia.useHere();
                               
                              
                        } */
                  }

                   // forçar reconectar
                  if(state == 'CONFLICT'){

                   // console.log("Cliente conectou em outro local, reconectando novamente...");
                   /* retornar conexão para api */
                   // inst_atual.forceRefocus();

                        if(action == 'destroy'){
                          /* remover instancia se o usuário conectar em outro local */
                              try{

                                  instancias[i].flag_exist = false;
                                  instancias[i].qrcode = 'despareado';
                                  instancias[i].status = false;
                                  

                                  process.on('SIGINT', function() {
                                    instancias[i].instancia.close();
                                  });

                                  await wpCtr.remove_caches(instancias[i].name);
                                  
                                  instancias[i].instancia = undefined;

                                  console.log("❌ Usuário conectou a sessão em outro local (whatsapp web), despareando a instancia do cliente..." + instancias[i].name);

                              }catch(err){
                                 
                                  console.log('🛑 Erro: Ao fechar a instancia!' + err);
                                  break;

                              }

                        }else if(action == 'forceOn'){

                        
                            console.log(" (CONFLITO DE LOCAIS CONECTADOS) reconectando a sessão!!");
                            await instancias[i].instancia.useHere();

                        }

                  }

                /*  console.log('✍🏽 instancia despareada:  ======== ');
                  console.log(instancias[i]); */
                 
               
              }
            }

            return true;
}

/* retornar o contido no object instancias */
async function getInfoIntance(instancia){
      var session = "";
      instancias.forEach(function(item){

        if(item.name == instancia){
         
          /* atualizar o qrcode */         
          session = item;
        }

      });   

      return session;
}

/* retornar todos os contatos da instancia */
exports.getAllContacts = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var contacts;
  
    // Is connected
    if(inst){      

        status = await inst.isConnected();
        contacts = await inst.getAllContacts();       
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'contatos':contacts,'status':status});

}


/* 12-08-2020 - retornar chat por contato */
exports.getChat = async function(req,res){

  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

  
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var chat = {}
  
    // Is connected
    if(inst){      


        status = await inst.isConnected();

        try{
          chat =  await inst.loadAndGetAllMessagesInChat(requisicao.number,true);   
        } catch (error) {
          chat = {"erro":"contato inexistente..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'chat':chat,'status':status});

}

/* criar grupo */
exports.createGroup = async function(req,res){
  var requisicao = req.body;
  var consulta;
  var status = false;

    
  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var result = false;


       /* verificar paramentros */
       if(!requisicao.instancia || !requisicao.titulo || !requisicao.membros){

        res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
        return;

      }
  
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{
         
            // Create group (title, participants to add)
           result = await inst.createGroup(requisicao.titulo, requisicao.membros);
         
        }catch(error) {
          res.status(200).send({'instancia':requisicao.instancia,'info':{"erro":"nenhum grupo encontrado..."},'status':status});
          return;
        }    

        res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});
        return;
    }
    

  }else{


    res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});

  }

}


/* gerir admin e participantes de grupo */
exports.setupParticipantGroup = async function(req,res){
  var requisicao = req.body;
  var consulta;
  var status = false;

    
  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var result = false;


       /* verificar paramentros */
       if(!requisicao.instancia || !requisicao.groupId || !requisicao.participant || requisicao.add !== true && requisicao.add !== false){

        res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
        return;

      }
  
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{        
         

          if(requisicao.add == true){

              // Remove participant
              result = await inst.addParticipant(requisicao.groupId, requisicao.participant);

          }

          if(requisicao.add == false){
               // Add participant
              result = await inst.removeParticipant(requisicao.groupId, requisicao.participant);

          }
          
          
        }catch(error) {
          res.status(200).send({'instancia':requisicao.instancia,'info':{"erro":"Ocorreu um erro ao executar a função, Grupo ou participante não identificado."},'status':status});
          return;
        }    

        res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});
        return;
    }
    

  }else{


    res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});

  }

}

/* add/remove admin grupo */
exports.setupAdminGroup = async function(req,res){
  var requisicao = req.body;
  var consulta;
  var status = false;

    
  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var result = false;


       /* verificar paramentros */
       if(!requisicao.instancia || !requisicao.groupId || !requisicao.participant || requisicao.isAdmin !== true && requisicao.isAdmin !== false){

        res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
        return;

      }
  
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{        
         
          //  console.log("Paramtros da requisição: ",requisicao);
          if(requisicao.isAdmin == true){

                // Remove participant
                result = await inst.promoteParticipant(requisicao.groupId, requisicao.participant);

          }

          if(requisicao.isAdmin == false){
               // Add participant
               result = await inst.demoteParticipant(requisicao.groupId, requisicao.participant);
                
          }
         
          
        }catch(error) {
          res.status(200).send({'instancia':requisicao.instancia,'info':{"erro":"nenhum grupo encontrado..."},'status':status});
          return;
        }    


        res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});
        return;
        
       
    }
    

  }else{


    res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});

  }

}


/* reotrnar todos os grupos */
exports.getAllGroups = async function(req,res){

  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

  console.log("Consultado grupos...");
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var Groups = {}
  
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{
          Groups =  await inst.getAllGroups();

          /* verificar se tem filtro por nome do grupo */
          if(requisicao.filter){

            var filtered = [];
            Groups.forEach(function(item){

              /* filtrar pesquisa (string parcial)*/            
              if (item.name.toLowerCase().indexOf(requisicao.filter.toLowerCase())  > -1){
                
                  filtered.push(item);

              }
      
            }); 
            
            if(filtered.length > 0){

              Groups = filtered;

            }else{

              /* nenhum grupo encontrado */
              Groups = {"erro":"nenhum grupo encontrado referente a posquisa..." + requisicao.filter}

            }

          }

        } catch (error) {
          Groups = {"erro":"nenhum grupo encontrado..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'groups':Groups,'status':status});

}

/* alterar permissão conversas no grupo (admin ou admin + cparticipantes) */
exports.setGroupChatAction = async function(req,res){

  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;
  var result = false;

   /* verificar paramentros */
   if(!requisicao.instancia || !requisicao.groupId || requisicao.desativarChat !== false && requisicao.desativarChat !== true){

    res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
    return;

  }

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

   //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;    
      
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{
              
          await inst.setGroupProperty(requisicao.groupId, 'announcement', requisicao.desativarChat);

          /* tornar grupo restrito para somente Admins - alterar dados */
          if(requisicao.restrito){
            if(requisicao.restrito == true){
              await inst.setGroupProperty(requisicao.groupId, 'restrict', requisicao.restrito);
            }
          }

        } catch (error) {
          res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'info':"Ocorreu um erro, provavelmente você não tem previlégio de administrador do grupo, para relaizar a operação, favor verifique.",'info':error,'status':status});
          return;
        }    
       

        res.status(200).send({'instancia':requisicao.instancia,'retorno':true,'status':status});
        return;
    }
    

  }else{

    res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});

  }

 
}

exports.setupGroupInfo = async function(req,res){    
  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;
  var result = false;

   /* verificar paramentros */
   if(!requisicao.instancia || !requisicao.groupId || !requisicao.titulo){

    res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
    return;

  }

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

   //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;    
      
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{
              
          /* alterar titulo do grupo */
          await inst.setGroupSubject(requisicao.groupId, requisicao.titulo);         

          /* alterar descrição do grupo */
          if(requisicao.descricao){
           
              await inst.setGroupDescription(requisicao.groupId, requisicao.descricao);
          
          }

           /* aterar descrição do grupo */
           if(requisicao.imagemUrl){
           
              await inst.setProfilePic(requisicao.imagemUrl, requisicao.groupId);
          
          }

        } catch (error) {
          res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'info':"Ocorreu um erro, provavelmente você não tem previlégio de administrador do grupo, para relaizar a operação, favor verifique.",'info':error,'status':status});
          return;
        }    
       

        res.status(200).send({'instancia':requisicao.instancia,'retorno':true,'status':status});
        return;
    }
    

  }else{

    res.status(200).send({'instancia':requisicao.instancia,'retorno':result,'status':status});

  }

  
}


/* reotrnar todos os grupos */
exports.getAllListTransm = async function(req,res){

  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

  console.log("Consultado Listas de Transmissão...");
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var lsttransm = {}
    var filtered = [];
  
    // Is connected
    if(inst){      
        
        status = await inst.isConnected();

        try{
          lsttransm = await inst.getAllChats();
         
           
            lsttransm.forEach(function(item){           

              /* pegat todas as listas de transmissao*/
              if(item.id.server == 'broadcast'){

                filtered.push(item);

              }
      
            }); 
          

         

        } catch (error) {
          lsttransm = {"erro":"nenhum grupo encontrado..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'lstTransm':filtered,'status':status});

}


/* retornar mensagem com url do arquivo (descriptografado) */
exports.FormatMessageFiles = async function(req,res){

      var requisicao = req.body;
      var inst;
      var consulta;
      var status = false;
      var message = {};

      /* verificar se instancia existe */
      consulta = await verify_instance(requisicao.instancia);

      
      //console.log(consulta);
      if(consulta.flag_exist == true){

        var inst = consulta.instancia;
        
        if(typeof requisicao.MsgId == undefined || !requisicao.MsgId){

          res.status(400).send({'instancia':requisicao.instancia,'message':{},'retorno':'favor informe o ChatId (id da mensagem).'});
          return;

        }

        // Is connected
        if(inst){      


            status = await inst.isConnected();

            try{
              
                    /* =============== alterar conteudo de arquivo recebido (DIRETORIO, OU BASE64) ================ */
                    /* verificar as configurações para API  PARA DOWNLOAD DE ARQUIVO RECEBIDO */  
                    var msgFormated = {};  
                      
                    if(confApi.files.decript_file_chat == true){
                        var retorno = await utils.formatReceivedFile(inst,requisicao).catch( await function(res){
                            
                            console.log("Resultado do retorno de processamento de arquivo do chat: ",res)
                            return res.retorno;

                        });
                    }

                      msgFormated = retorno;
                      //console.log(retorno);

                      if(msgFormated){
                        message = msgFormated;
                        res.status(400).send({'instancia':requisicao.instancia,'retorno':msgFormated,'status':status});
                        return;
                      }

            }catch (error) {
              message = {"erro":'Ocorreu um erro ao efeturar operação.'}
            }    
          // console.log(hook);
        }
        

      }

      res.status(400).send({'instancia':requisicao.instancia,'retorno':message,'status':status});


}


/* enviar mensagem de texto */
exports.sendMensagem = async function(req, res){
  var requisicao = req.body;
  var inst;
  var consulta;
 

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;

      var retorno = await inst.sendText(requisicao.number, requisicao.msg);
      // console.log(retorno);
        /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ==== Resolvendo, 9º dígito, para tentar novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;

          console.log("========================" + requisicao.number);
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.number, null);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }

     
   }else{

      res.status(200).send({'retorno':false});

   }
 
};

/* enviar localidade */
exports.sendLocation = async function(req ,res){
  
  var requisicao = req.body;
  var inst;
  var consulta;  


  /* verificar paramentros */
  if(!requisicao.instancia || !requisicao.number || !requisicao.latitude || !requisicao.longitude || !requisicao.titulo_local ){

    res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
    return;

  }

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;
     
      var retorno =  await inst.sendLocation(requisicao.number,requisicao.latitude,requisicao.longitude, requisicao.titulo_local)
            .then((result) => {
              
              res.status(200).send({'retorno':result});
              return;

            })
            .catch((erro) => {

              res.status(400).send({'retorno':erro});
              return;
           
            });

   }else{

      res.status(200).send({'retorno':false});

   }


}

/* enviar link preview */
exports.sendLinkPreview = async function(req,res){


  var requisicao = req.body;
  var inst;
  var consulta;  


  /* verificar paramentros */
  if(!requisicao.instancia || !requisicao.number || !requisicao.link || !requisicao.caption){

    res.status(200).send({'retorno':"parâmetros incorretos favor verifique."});
    return;

  }

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;
     
      var retorno =  await inst.sendLinkPreview(requisicao.number,requisicao.link,requisicao.caption)
            .then((result) => {
              
              res.status(200).send({'retorno':result});
              return;

            })
            .catch((erro) => {

              res.status(400).send({'retorno':erro});
              return;
           
            });

   }else{

      res.status(200).send({'retorno':false});

   }



}

/* enviar mensagem para novo contatos */
exports.sendMsgNewContact = async function(req, res){
  var requisicao = req.body;
  var inst;
  var consulta;  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;
     
      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);
      
       /* se o envio falhar retirar o 9º dígito e tentar novamente */
         /* se o envio falhar retirar o 9º dígito e tentar novamente */
         if(retorno == false){

          console.log(" ==== Resolvendo, 9º dígito, para tentar novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }

   }else{

      res.status(200).send({'retorno':false});

   }
 
};


/* ouvir mensagens */
exports.newMsg = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var hook = consulta.hook;
  
    // Is connected
    if(inst){      

        status = await inst.isConnected();       
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'hook':hook,'status':status});  

}

/* getProfilePic */
exports.getProfilePic = async function(req, res){

    var requisicao = req.body;
    var status = "Inexistente";
    var consulta = await verify_instance(requisicao.instancia);

    
  //console.log(consulta);
      if(consulta.flag_exist == true){

        var inst = consulta.instancia;
        var urlPic = {}
      
        // Is connected
        if(inst){      


            status = await inst.isConnected();       

            urlPic = await inst.getProfilePicFromServer(requisicao.number).then((result) => {

                  return result;

              }).catch((erro) => {
                  //console.error('Error when sending: ', erro); //return object error
                  console.log("👉Erro ao consultar a imagem de pergil do contato!", erro);
                  return false;
              });



      res.status(200).send({'instancia':requisicao.instancia,'img':urlPic,'status':status}); 

    }

  }else{

    res.status(200).send({'instancia':requisicao.instancia,'img':urlPic,'status':status});  

  }



}

/* retornar todas as mensagens de um contato */
exports.get_AllMsgs = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 // var chatId = requisicao.number;


  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var webhook = {}
  
    // Is connected
    if(inst){      


        status = await inst.isConnected();

        try{
          webhook =  await inst.getAllChats();   
        } catch (error) {
          webhook = {"erro":"contato inexistente..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'webhook':webhook,'status':status}); 
}

/* retornar mensagens não lidas */
exports.getUnreadMsg = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
  var messages = [];
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
  
    // Is connected
    if(inst){      
      try{
        status = await inst.isConnected();       
        messages = await inst.getAllUnreadMessages();
      }catch(erro){
        res.status(200).send({'instancia':requisicao.instancia,'info':'ocorreu um erro ao executar a operação: ' + erro,'status':status});
        return;
      }
    }

    res.status(200).send({'instancia':requisicao.instancia,'msgs':messages,'status':status});
    

  }else{

    res.status(200).send({'instancia':requisicao.instancia,'info':"Erro, instancia mão inicializada/inexsitente.",'status':status}); 

  }

}

/* converter url for base64 */
var loadBase64Image = async function (url, callback) {
  // Required 'request' module
 
      imageToBase64(url) // Image URL
      .then(
          (response) => {
              return response; // "iVBORw0KGgoAAAANSwCAIA..."
          }
      )
      .catch(
          (error) => {
              console.log(" Erro ao ler a url do arquivo a ser enviado: " + error); // Logs an error if there was one
          }
      )

};


/* enviar mensagem com img */
exports.sendMsgMedia = async function(req,res){
    var requisicao = req.body;
    var status = "Inexistente";
    var consulta;
    var result = false;
    var chatId = requisicao.number;
    var msg = requisicao.msg;
    var fileName = requisicao.tipo;

    
    consulta = await verify_instance(requisicao.instancia);    

    if(consulta.flag_exist == true && requisicao.arquivo && chatId && msg){

        var inst = consulta.instancia;         

        // Is connected
        if(inst){      

            status = await inst.isConnected();
            var pars = {
              'instancia':consulta.nome,
              'sessao': inst,
              'number': chatId,
              'fileName':requisicao.tipo,
              'arquivo': requisicao.arquivo,
              'msg': msg
            };

           

            result = await ctrFile.formatFilesSend(pars).then( async function(rs){
                       
                        return rs;

                    }).catch((erro) => {
                        console.error('Error na tentativa de enviar mensagem com arquivo: ', erro); //return object error
                        return erro;
                        
                    });


        }
      

    }

    res.status(200).send({'instancia':requisicao.instancia,'status':status,'retorno':result.retorno}); 
}

/* pegar qrcode */
exports.getQrcode = async function(req,res){
  /* params:  token */
  var requisicao = req.body;
  var consulta = {'flag_exist':false,'instancia':undefined};
  var status = "UNPAIRED";

  var inst;

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
    res.status(200).send({'instancia':requisicao.instancia,'status':status, 'error':'Digite um nome para instancia!'});
    return;
  }

  

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);
  /* O QRCODE SÓ É CRIADO APÓS ALGUNS SEGUNDOS QUANDO A FUNÇÃO CREATE GERAR PORTANTO AGUARDAR UNS 15 SEGS */  


  if(consulta.flag_exist == false){

      await setup_instancia(requisicao.instancia, requisicao.remover_cache);

      /* pegar qrcode da instancia criada */
      sessao = await getInfoIntance(requisicao.instancia);

       //  console.log("======================",sessao);
      if(sessao !== undefined){

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':sessao.qrcode, 'status':sessao.status});
    
      }else{

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':'wait...', 'status':sessao.status});

      }
  

  }else if(consulta.flag_exist == true){

     /* pegar qrcode da instancia criada */
     sessao = await getInfoIntance(requisicao.instancia);
     inst = consulta.instancia; /* pull de instancias */
    
     if(inst){

        // Is connected
       // status = await inst.isConnected();
       status = await inst.getConnectionState();/* VERIFICAR STATUS DA CONECÇÃO */
       if(status == "CONNECTED"){
        sessao.status = true;
       }

       if(status == "UNPAIRED"){

          /* remover cache (arquivo pasta tokens) */
        if(requisicao.remover_cache == true){

          console.log("❌❕ Dados da Instancia Travada: ------------->",requisicao.instancia)
          await wpCtr.remove_caches(requisicao.instancia);

        }

       }
        
        console.log("Status consulta wp: " + sessao.status);

     }
    
     return res.status(200).json({'instancia':requisicao.instancia,'qrcode':sessao.qrcode, 'status':sessao.status});
     
  }else{

    return res.status(200).json({'instancia':requisicao.instancia,'qrcode':qrcode, 'status':sessao.status});

  }
  
}

/* listar instancias ativas */
exports.get_instancias = async function(req,res){
  var requisicao = req.body;
  var insts = {"quantidade":0,"instancias":[]};
  var qtdeInst = 0; 

      instancias.forEach( async function(item){       

            insts.instancias.push({'nome':item.name, 'status':item.status}); 
            qtdeInst = qtdeInst + 1;
      });

      insts.quantidade = qtdeInst;
   
      res.status(200).send({'retorno':insts});
}

/* pegar status */
exports.getStatus = async function(req,res){
  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 
 //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    
    // Is connected
    if(inst){
      status = await inst.isConnected();
      console.log(status);
      
    }

    /* verificar o status do qrcde (se estiver UNPAIRED, RENOMEAR STATUS FINAL) */
    instancias.forEach( async function(item){       

      if(item.name == requisicao.instancia){

        if(item.status == "UNPAIRED"){
            status = item.status;
        }        
       
      }
    });
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'status':status});

}


/* manter o status do whatsapp como 'online' ao invez de 'visto por ultimo em:' */

exports.set_OnAgora = async function(req,res){
  var now = new Date();
  var msg = 'Estamos online - ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  var retorno = false;

  instancias.forEach( async function(item){

    consulta = await verify_instance(item.name);

    var inst = consulta.instancia;
 
    if(consulta.flag_exist == true){

        console.log(" ✍🏻 ====> Alterando status de exibição para os contatos como: 'Estamos Online'!");
          /* alterar status de cada instancia */
       // retorno = inst.setProfileStatus(msg);
       retorno = inst.useHere();
      }
      

  });

  res.status(200).send({'retorno':retorno});
}

/* checkar se número é whatsapp válido */
exports.check_number = async function(req,res){

  var requisicao = req.body;

  var consulta = await verify_instance(requisicao.instancia);
  var status = "Inexistente";
  var retorno = false;

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
      res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Digite um nome para instancia!'});
      return;
  }

  if(!requisicao.number || requisicao.number == undefined || requisicao.number == ""){

    res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Favor verifique o número de telefone fornecido!'});
    return;

  }

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    
    if(inst){

         /* remover o registro da instancia na global - instancias = [{}] */
         for(var i =0;i < instancias.length; i++){

              if(instancias[i].name == requisicao.instancia){
                
                  try {

                    retorno = await inst.getNumberProfile(requisicao.number);
                    if(retorno == 404){
                      retorno = false
                    }
                    
                  }catch (error) {
                    res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Ocorreu um erro ao efetuar a operação, tente novamente...'});
                  }
    
                
              }
    
        }

        

    }

    
  }

  res.status(200).send({'instancia':requisicao.instancia,'retorno':retorno});

}

/* função destruir sessão */
exports.logoff = async function(req,res){
  
  var requisicao = req.body;

  var consulta_ = await verify_instance(requisicao.instancia);
  var status = "Inexistente";

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
      res.status(200).send({'instancia':requisicao.instancia,'status':status, 'error':'Digite um nome para instancia!'});
  }

  
      for(var i =0;i < instancias.length; i++){
       
        if(instancias[i].name == requisicao.instancia){
          instancias.splice(i, 1);          
         // instancias[i].qrcode = "";
         // instancias[i].status = "removed";
          status = "DISCONECTED";     

          /* remover cache (arquivo pasta tokens) */
          if(requisicao.remover_cache == true){

            console.log("❌❕ Dados da Instancia Travada: ------------->",requisicao.instancia)
            await wpCtr.remove_caches(requisicao.instancia);

          }
        }

      }

    



  if(consulta_.flag_exist == true){

    var inst = consulta_.instancia;
    
    if(inst){


          // Try-catch close
        

        /* fechar/remover sessão  */
         /* remover o registro da instancia na global - instancias = [{}] */
         for(var i =0;i < instancias.length; i++){           
            

              if(instancias[i].name == requisicao.instancia){               
                
                try {

                    process.on('SIGINT', function() {
                      console.log("❌ Fechando a sessão (close()).")
                      inst.close();
                    });

                    
                  
                   // console.log(r);
    
                    console.log("instância fechada (close)...");
                  
                }catch (error) {
                  
                    console.log("erro ao destruir a sessão, continuando...");
  
                }

               
                status = "DISCONECTED";
                console.log("Entrou..."); 
                
                instancias.splice(i, 0); /* remover item (instancia) */
                break;
                
              }
        }

        

    }else{
      console.log("Instancia não iniciada globalmente...")
    }


  }

  res.status(200).send({'instancia':requisicao.instancia,'status':status});

  /* se precisar retornar erro */
 // res.status(400).send({'error':'não foi possível realizar operação, favor verifique os dados.'});
 // res.status(200).send({'instancia':requisicao.instancia,'retorno':status});

}


/* retornar qrcde base64 */
 function exportQR(qrCode, path){

    qrCode = qrCode.replace('data:image/png;base64,', '');

  //  console.log(qrCode);
   // const imageBuffer = Buffer.from(qrCode, 'base64');
  
    // Creates 'marketing-qr.png' file
 //   fs.writeFileSync(path, imageBuffer);

   return qrCode;
}

function fileExportQR(qrCode, path){
  qrCode = qrCode.replace('data:image/png;base64,', '');
  const imageBuffer = Buffer.from(qrCode, 'base64');

  // Creates 'marketing-qr.png' file
  fs.writeFileSync(path, imageBuffer);
}

/* u/ tilidades - REMOVER ITEM DO ARRAY */
async function arrayRemove(arr, value) {

  return arr.filter(function(ele){
      return ele != value;
  });

}


/* =======ÃO TERMINADO CONCLUIR 28-08-2020 ======= download de arquivos do contato */
exports.downloadFilesUser = async function(req,res){

  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.number = "55" + requisicao.number + "@c.us";

      inst = consulta.instancia;

      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);

      try{
        chat =  await inst.loadAndGetAllMessagesInChat(requisicao.number);   
      } catch (error) {
        chat = {"erro":"contato inexistente..."}
      }  
    

   


      if(confApi.files.return_patch_files == true){
        /* ==== ATENÇÃO ======= PARA DOCS precisa aplicar descriptografar arquivo */
                var buffer = await inst.downloadFile(message);

                /* salvar o arquivo recebido na mensagem em diretorio local (para cliente acessar via link do front) */
                var now = new Date();
                var nameFile = message.id  + '-' + now.getSeconds() + "." +  mime.extension(message.mimetype);
                var fileName = "";
                var base_dir = "";
                var ret = ""; 
                var tipo = ""; 



                /* se for audio */
                if(message.type = "ptt"){

                tipo = "audio";
                base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                fileName = __dirname + base_dir;

                /* criar o arquivo .ogg */
                await fs.writeFileSync(fileName, buffer, function (err){
                ret = err;
                console.log(err);
                });

            
                }


      }


    } /* fim da verificação da instancia */


}



/* ======= INTEGRAÇÕES ======= */

/* ISP Controlls - enviar mensagem de texto */
/* enviar mensagem para novo contatos 
  Params:  instancia, number, msg
*/
exports.IspControllsMsg = async function(req, res){
  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.number = "55" + requisicao.number + "@c.us";

      inst = consulta.instancia;

      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);

          /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ✍️ ==== Resolvendo, 9º dígito, e tentando novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.number, null);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }


   }else{

      res.status(200).send({'retorno':false});

   }
 
};


/* integração SGP */
exports.msgSgp = async function(req, res){
  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  var instancia = requisicao.inst;

  console.log("Requisição do SGP: ",requisicao);
  if(requisicao.inst == undefined || requisicao.inst == ""){
       res.status(400).send({'retorno':false,"erro":"Instancia do cliente, inexistente."});
       return;
  }


  /* verificar se instancia existe */
  consulta = await verify_instance(instancia);


   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.to =  requisicao.to + "@c.us"; /* codigo País é Adicionado Automaticamente pelo SGP */

      inst = consulta.instancia;

      var retorno = await inst.sendText(requisicao.to, requisicao.msg);

          /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ✍️ ==== Resolvendo, 9º dígito, e tentando novo envio...");
          var texto = requisicao.to;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.to, null);

          var rs = "Ocorreu um erro.";
          if(retorno){
              rs = "Mensagem enviada com Sucesso!"
          }

          res.status(200).send({'retorno':rs});
          return;

      }else{

          var rs = "Ocorreu um erro.";
          if(retorno){
              rs = "Mensagem enviada com Sucesso!"
          }

          res.status(200).send({'retorno':rs});
          return;

      }


   }else{

      res.status(200).send({'retorno':false});

   }
 
};



/* notificações */
exports.notificacoes = async function(){

  
  var notificacao = {'instancia':undefined, webhook:undefined};


      /* verificar se tem notificação se houver retornar dados da instancia e a notificação */
      instancias.forEach(function(item){

        if(item.webhook){
            notificacao.instancia = item.name;
            notificacao.webhook = item.webhook;
           // console.log(notificacao.webhook);
            /* inicializar webhook */
            item.webhook = undefined;
        }

      }); 


  return notificacao;

    /* ref.:  http://rcdevlabs.github.io/2015/02/11/criando-um-server-de-push-notifications-para-notificacoes-em-tempo-real-com-socket-io-e-nodejs/ */
}

/* paginas http-front */
exports.front = function(req,response){

  var page = 'index.html';

  if(req.url != '/'){

    page = req.page + '.html';

  }

    fs.readFile('./public/' + page, function(err,data){
      var statusHead = 200;
      if(err){
        statusHead = 404;
      }

      response.writeHead(statusHead,{'Content-type':'text-html; charset=utf-8'});
      response.write(data);
      response.end();

    });

}



/* enviar um post para php */
async function send_post(params, type){

    var postConf = confApi.send_post_php;
    var link = postConf.post_url.link;

    /* verificar tipo de envio */
    if(type == "newMsg"){

        postConf = confApi.send_post_php;
        link = postConf.post_url.link;

    }else if(type == "StatusMsg"){
      /* enviar status da mensagem (se foi lida etc...) */
        postConf = confApi.send_action_message;
        link = postConf.post_url.link;

    }else if(type == "notifyMsg"){
      /* enviar status da mensagem (se foi lida etc...) */
        postConf = confApi.send_notify_msg;
        link = postConf.post_url.link;

    }


   // console.log(params);
    if(link == undefined || link == ""){
      return;
    }

    /* verificar se precisa de autenticação */
    var autenticar = postConf.post_url.autenticar;
    var username = postConf.post_url.user;
    var password = postConf.post_url.passwd;
    var auth = "";   
    
    if(autenticar == true){

      username = "umbler",
      password = "testehospedagem",    
      auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

    }

    

    request.post({
        headers: {'content-type': 'application/json','Authorization' : auth},
        url: link,
        form: params
    }, function(error, response, body){
     // console.log(body)
        console.log("➡️ post enviado para endpoint!");
    });

}
