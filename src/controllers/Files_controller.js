'use strict'
/* converter url para base64 */
const imageToBase64 = require('image-to-base64');
const fs = require('fs');
var Url = require('url');
var Path = require('path');
var getStat = require('util').promisify(fs.stat);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var confApi = require('../../config/api');

/* ======= funções úteis ======== */
exports.formatFilesSend = async function(params){

    /* 
         PARAMETROS DA FUNÇÃO:
            instancia (nome da instancia utilizada)
            sessao (funções de envio)
            number (whatsapp@c.us)
            arquivo (url)
            msg (mensagem)
    */

    var fileName = "";
    var dirFile = "";
    var now = new Date();    
    var bitmap;
    var image;
    var count = params.arquivo.length;
    var ext = "";
    var audio = false;

    var TypeFile = false;

    /* verificar se possui arquivo na mensagem */
    if (params.arquivo !== undefined && params.arquivo !== "") {

        if (params.arquivo.length > 0) {
            TypeFile = true;
        }

    }
    
    
   
    return new Promise( async (resolve, reject) => {

       // console.log("Tipo é arquivo? : " + TypeFile);
        if (TypeFile == true){

                        /* verificar tipo de arquivo base64 ou via url */
                        if(confApi.files.send_patch_files == true){

                                /* pegar extenção do arquivo na url */                               
                                ext = Path.extname(Url.parse(params.arquivo).pathname).replace('.',''); /* pegar extenção da url do arquivo */
                                fileName = "FILE_"  + params.number.replace('@','').replace('.','') + "_" + now.getSeconds() + "." + ext;
                                dirFile = './public/files/wapi/download/diversos/' + fileName;


                                if(ext == 'pdf' || ext == 'doc' || ext == 'docx' || ext == 'txt' || ext == 'rtf'){
                                    

                                            fileName = "DOCUMENTO_"+ params.number + "_" + now.getSeconds() + "." + ext;
                                            dirFile = './public/files/wapi/download/documento/' + fileName; 
                                        /* converter arquivo (url) em base64 */
                                        await imageToBase64(params.arquivo) // Image URL
                                            .then(
                                                (response) => {
                                                // console.log("imagem:  " + response);
                                                image = response;
                                                bitmap = new Buffer(image, 'base64');
                                                }
                                            )
                                            .catch(
                                                (error) => {
                                                    result = "⛔️ Erro ao ler a url do arquivo a ser enviado: " + error; // Logs an error if there was one                               
                                                    reject({'retorno':result});
                                                    return;
                                                }
                                            )
                                            
                                    }else{
                                            /* converter arquivo (url) em base64 */
                                        await imageToBase64(params.arquivo) // Image URL
                                        .then(
                                            (response) => {
                                                // console.log("imagem:  " + response);
                                                image = response;
                                                bitmap = new Buffer(image, 'base64');
                                            }
                                        )
                                        .catch(
                                            (error) => {
                                                result = "⛔️ Erro ao ler a url do arquivo a ser enviado: " + error; 
                                                reject({'retorno':result});
                                                return;
                                            }
                                        )

                                    }

                                    // write buffer to file
                                    await fs.writeFileSync(dirFile, bitmap);

                                        /* se for audio conveerter para mp3 */
                                        if(ext == "ogg" || ext == "oga" || ext == "mp3" || ext == "wav"){
                                            audio = true;
                                            fileName = "AUDIO_" + params.number + "_" + now.getSeconds() + ".mp3";
                                            var dirDest = './public/files/wapi/download/audio/' + fileName; 
                                            var result = false;
                                            result = await setupAudio(dirFile, dirDest).then(async function(res){
                                                    console.log("arquivo de audio convertido...");
                                                   
                                                    return res;
                                            });
                                           /*  var b64 =  fs.readFileSync(dirFile,{encoding:'base64'});
                                            var b64_ = "data:audio/"+ ext +";base64," + b64.toString();
                                            
                                            /* fazer envio de mensagem com arquivo */
                                           /* result = await params.sessao.sendPtt(params.number,b64_, fileName, params.msg); */

                                           /* pegar informações do arquivo se for menor igual a 2MB, enviar como gravação se não como arquivo .mp3 */
                                           var infoFile = await getStat(dirFile);
                                            //console.log(infoFile);
                                            if(infoFile.size <= 2097152) /* menor igual 2MB */
                                            {

                                                result = await params.sessao.sendPtt(params.number,dirFile, fileName, params.msg); 

                                            }else{

                                                result = await params.sessao.sendFile(params.number,dirFile, fileName, params.msg); 

                                            }

                                            
                                        
                                            resolve({"retorno":result});
                                            return;
                                        
                        
                                        }else if(ext == "mp3"){
                                            // converter buffer to file
                                            await fs.writeFileSync(dirFile, bitmap);
                                            resolve({"retorno":true});
                                            return;
                                        }                        
                        
                                        /* continua para envio do arquivo diverso... */

                                }/*  base64 ou url */
                                else if(confApi.files.send_patch_files == false){ /* se for base64 */


                                    /* pegar extenção do arquivo na url */                                    
                                    var posI = params.fileName.indexOf(".");
                                    var posF = params.fileName.length;
                                    ext = params.fileName.substr(posI,posF);
                                    fileName = "FILE_"  + params.number.replace('@','').replace('.','') + "_" + now.getSeconds() + "." + ext;
                                    dirFile = './public/files/wapi/download/diversos/' + fileName;

                                    /* arqui será tratado qualquer arquivo para envio via base64 */
                                    bitmap = new Buffer(params.arquivo, 'base64');
                            
                                 }
                                
                                
                                // write buffer to file
                                fs.writeFileSync(dirFile, bitmap);
                            
                                if(params.arquivo && params.number && params.msg){        
                                        
                                        result = await params.sessao.sendFile(params.number,dirFile, fileName, params.msg); 
                                       // console.log("Enviando mensagem: " + result);                              
                            
                                }
                            
                                resolve({'retorno':result}); 

                }/* verificar existe arquivo a ser tratado e enviado */
                else{
                    reject({'retorno':false,'erro':'não existe arquivo e ser enviado, favor verifique.'});
                }

        });


}


async function setupAudio(dirOrigem, dirDestino){
    /* SOMENTE AUDIO 
        parametros:
             dirOrigen (local do arquivo de origem)
             dirDestino (local do arquivo de destino a ser gerado)
    */

    return new Promise( async (resolve, reject) => {
        try {
           
            ffmpeg(dirOrigem)
            .output(dirDestino)
            .on('end', function() {                    
                console.log('conversão concluida!');
                resolve(true);
            }).on('error', function(e){
                console.log('error: ', e);
                reject(false);
            }).run();

        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
            reject(false)
        }

    });


}