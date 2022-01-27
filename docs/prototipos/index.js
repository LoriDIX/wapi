/* função para criação de botões nas mensagens enviadas 10/07/2020 - em teste de desenvolvimento */
window.WAPI.sendButtons = async function (chatId) {
        var chat = chatId.id ? to : Store.Chat.get(chatId);
        var chatId = chat.id._serialized;
        var tempMsg = Object.create(chat.msgs.filter((msg) => msg.__x_isSentByMe)[0]);
    
    
        var newId = window.WAPI.getNewMessageId(chatId);
        var extend = {
            ack: 0,
            id: newId,
            local: !0,
            self: "out",
            t: parseInt(new Date().getTime() / 1000),
            to: chat.id,
            isNewMsg: !0,
            type: "template",
            subtype:"text",
            body:'test',
            caption:'test',
            isForwarded:false,
            broadcast:false,
            isQuotedMsgAvailable:true,
            shouldEnableHsm:false,
            __x_hasTemplateButtons:true,
            invis:true
        };
    
        Object.assign(tempMsg, extend);
        Store.Parser.parseTemplateMessage(tempMsg,{
    hydratedButtons:[
    
          {
            "id": "0",
            "displayText": "Informar dados",
            "subtype": "quick_reply",
                  "quickReplyButton":true,
            "selectionId": "{\"eventName\":\"inform\"}"
          },
          {
            "id": "1",
            "displayText": "Enviar foto RG",
                  "quickReplyButton":true,
            "subtype": "quick_reply",
            "selectionId": "{\"eventName\":\"event-rg\"}"
          },
          {
            "id": "2",
                  "quickReplyButton":true,
            "displayText": "Enviar foto CNH",
            "subtype": "quick_reply",
            "selectionId": "{\"eventName\":\"event-cnh\"}"
          }
    
                // {
                //   "id": "0",
                //   "displayText": "Information!",
                //   "actionText": "Information!",
                //   "subtype": "quick_reply",
                //   "quickReplyButton":true,
                //   "selectionId": "{\"eventName\":\"inform\"}"
                // },
                // {
                //   "id": "1",
                //   "displayText": "Send a photo",
                //   "actionText": "Information!",
                //   "subtype": "call",
                //   "callButton":true,
                //   "phoneNumber":"+441231231232",
                //   "selectionId": "{\"eventName\":\"event-rg\"}"
                // },
                // {
                //   "id": "2",
                //   "displayText": "Send license",
                //   "actionText": "Information!",
                //   "urlButton":true,
                //   "subtype": "url",
                //   "url":"https://google.com",
                //   "selectionId": "{\"eventName\":\"event-cnh\"}"
                // }
            ],
    hydratedContentText:'hellllloooowww',
    // hydratedFooterText:"asdasd",
    // hydratedTitleText:"asdasd232"
    })
    
        tempMsg._minEphemeralExpirationTimestamp()
        tempMsg.senderObj.isBusiness=true;
        tempMsg.senderObj.isEnterprise=true;
        await Store.addAndSendMsgToChat(chat, tempMsg)
    };
    
    
    /* principal quase funcional */
    window.WAPI.sendButtons2 = async function sendMessageWithTags(to, body) {
        var chat = to.id ? to : Store.Chat.get(to);
        var chatId = chat.id._serialized;
        var msgIveSent = chat.msgs.filter((msg) => msg.__x_isSentByMe)[0];
        if (msgIveSent) {
          //return chat.sendMessage(body);
        }
      
        var tempMsg = Object.create(msgIveSent);
        var newId = new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true }); //window.WAPI.getNewMessageId(chatId);
        var extend = {
              ack: 0,
              id: newId,
              local: !0,
              self: "out",
              t: parseInt(new Date().getTime() / 1000),
              to: chat.id,
              isNewMsg: !0,
              type: "template",
              subtype:"text",
              body:'test',
              caption:'test',
              isForwarded:false,
              broadcast:false,
              isQuotedMsgAvailable:true,
              shouldEnableHsm:false,
              __x_hasTemplateButtons:true,
              invis:true
          };
      
          Object.assign(tempMsg, extend);
          Store.Parser.parseTemplateMessage(tempMsg,{
      hydratedButtons:[
           
           {
                    "id": "0",
                     "displayText": "Send license",
                     "actionText": "Information!",
                     "urlButton":true,
                    "subtype": "url",
                     "url":"https://google.com",
                    "selectionId": "{\"eventName\":\"event-cnh\"}"
            }
      
                  // {
                  //   "id": "0",
                  //   "displayText": "Information!",
                  //   "actionText": "Information!",
                  //   "subtype": "quick_reply",
                  //   "quickReplyButton":true,
                  //   "selectionId": "{\"eventName\":\"inform\"}"
                  // },
                  // {
                  //   "id": "1",
                  //   "displayText": "Send a photo",
                  //   "actionText": "Information!",
                  //   "subtype": "call",
                  //   "callButton":true,
                  //   "phoneNumber":"+441231231232",
                  //   "selectionId": "{\"eventName\":\"event-rg\"}"
                  // },
                  // {
                  //   "id": "2",
                  //   "displayText": "Send license",
                  //   "actionText": "Information!",
                  //   "urlButton":true,
                  //   "subtype": "url",
                  //   "url":"https://google.com",
                  //   "selectionId": "{\"eventName\":\"event-cnh\"}"
                  // }
              ],
       //hydratedContentText:'hellllloooowww',
       //hydratedFooterText:"asdasd",
       hydratedTitleText:"asdasd232"
      })
      
         // tempMsg.__x_ephemeralExpirationTimestamp()
          tempMsg.senderObj.isBusiness=true;
          tempMsg.senderObj.isEnterprise=true;
          await Store.addAndSendMsgToChat(chat, tempMsg)
      }
      