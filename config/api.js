

'use strict' 
/* link de referencia: https://github.com/open-wa/wa-automate-nodejs/issues/563#issuecomment-647030529 */

var configs = {  
  "files": {
        "return_patch_files": true, /* ao retornar arquivos recebidos nas mensagens - retornar false=base64 ou true= diretorio local do arquivo  */
        "send_patch_files":true, /* no envio de arquivos para mensagens, false = base64 e true= url do arquivo (parâmetros de envio) */
        "decript_file_chat":true /* descriptografar arquivo do chat */
  },
  "sessions": {
       "autoClose" : 2 /* minutos */
  },
  /* ==== configurar envio de post a um link ==== */
  "send_post_php":{
      "active":false,
      "post_url":{
        "link": "https://hub.dixhealth.com.br:5002/backend/v1/cospeRequest",
        "autenticar":false,
        "user":"",
        "passwd":""
      },
      "sendSeen":true, /* tornar nova msg recebida como lida ? */
      "sendForMe":true, /* enviar msg enviadas */
      "sendForGroups":false,
      "sendForStatus":false
  },
  "sendSeen":false, /* tornar nova msg recebida como lida ? */
  "send_action_message":{
    "active":false,
    "post_url":{
      "link": "http://localhost:3002/api/v1/whatsapp/receiveMessage",
      "autenticar":false,
      "user":"",
      "passwd":""
    }
  },
    "send_notify_msg":{ /* notificações de ocorrencias de mensagens (voz, mensagem) chamadas perdidas */
      "active":false,
      "post_url":{
        "link": "http://localhost:3002/api/v1/whatsapp/receiveMessage",
        "autenticar":false,
        "user":"",
        "passwd":""
      },

    }    
   
};

configs.sessions.autoClose = (configs.sessions.autoClose) * 60000; /* converter minutos em milisegundos */
 
 module.exports = configs;
