'use strict'

const fs = require('fs');
var mime = require('mime-types');
var confApi = require('../../config/api');

exports.formatReceivedFile = async function(instancia, requisicao){

       /* salvar o arquivo recebido na mensagem em diretorio local (para cliente acessar via link do front) */
       var now = new Date();
       var nameFile = "";
       var fileName = "";
       var base_dir = "";
       var ret = ""; 
       var tipo = ""; 

       /* retornar o objcto da mensagem usando CHatID (id do chat - conversa) */
       var message = {};
console.log("pegando mensagens do chat");
              
    
    return new Promise( async (resolve, reject) => {


            /* filtrar chat */
       var chats;
       

       if(requisicao.MsgId !== undefined){

          await instancia.loadAndGetAllMessagesInChat(requisicao.number,true).then(async function(res){

                  chats = res;

                  for(var i = 0; i < chats.length; i++){
                
                    /* verificar id da message */
                    if(chats[i]){
                      if(chats[i].id == requisicao.MsgId){
                        //console.log(chat[i]);
                        message = chats[i];
                        break;
                      }
                    }
        
              }

          });

      }else{

          message = requisicao;

      }

   //    console.log(chats);
       
      //  console.log(message)
      var ext = mime.extension(message.mimetype);

        if(message){
          var nameFile = "naoDefinido";

          if(!requisicao.MsgId){
              nameFile = requisicao.id;
          }else{
            nameFile = requisicao.MsgId;
          }
           nameFile = nameFile  + '-' + now.getSeconds() + "." +  ext;
        }else{
          return {"retorno":"erro conversasão não identificada!"};
        }
 

        var buffer;
        /* tratar decript do arquivo caso der erro (ANDRE - 22-03-2021) */
        try{

           buffer = await instancia.decryptFile(message); 

        }catch(error){

          reject({"erro":"Ocorreu um erro ao descriptografar o arquivo.",retorno:message});
          return;

        }

              
        console.log("Extenção do arquivo a ser tratado: ",ext);
        //console.log("Base64 do arquivo:",buffer);
                /* =============== alterar conteudo de arquivo recebido (DIRETORIO, OU BASE64) ================ */
                            /* verificar as configurações para API  PARA DOWNLOAD DE ARQUIVO RECEBIDO */
        if(confApi.files.return_patch_files == true){
                                /* ==== ATENÇÃO ======= PARA DOCS precisa aplicar descriptografar arquivo */
            
                /* se for audio */
               if(ext == "ogg" || ext == "oga" || ext == "mp3" || ext == "wav"){
                
                 tipo = "audio";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;
                
                 /* criar o arquivo .ogg */                 
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                     return;
                 });

                 if(!ret){
                    message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                    console.log(message.directPath);
                }

              
                 /* se for documento */
               }else if(message.type = "document"){

                 tipo = "documento";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;
                
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                     return;
                 });

                 
                 if(!ret){
                    message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                    console.log(message.directPath);
                }
              

               }else{

                 tipo = "diversos";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;
                
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                     return;
                 });

                 
                 if(!ret){
                      message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                      console.log(message.directPath);
                  }
             }

                /* se houver erro retornar */
                if(ret){

                 message.body = "ocorreu erro ao gerar o link: " + ret; /* retornar erro na geração do arquivo */
                 reject({"erro":"ocorreu um erro ao gerar o arquivo.",retorno:message});

               }

             
               if(ext == 'docx' || ext == 'doc' || typeof message.directPath == undefined){
                   /* neste caso irá criar o indice (body) */
                   message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                }


             resolve({retorno:message});

              

         }else{

            reject({"erro":"APi não configrada para tratativa de arquivos.",retorno:message});

         }

    });


}