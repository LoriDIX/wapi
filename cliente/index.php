<?php

    /* chamada classe wapi*/

    require('./wapi_class.php');

    $wapi = new wapi_class;


    /* gerar instancia (qrcode) */
    $pametro = (object) array(
        "instancia" => "financeiro-01"
    );    
    $retorno = $wapi->setupInstancia($pametro);

    

   /* if($retorno->qrcode == "syncronized"){
        echo "whatsapp CONECTADO";die();
    }
    echo "<img src='".$wapi->host_api."/".$retorno->qrcode."' style='width:200px; heigth:200; margin-top:40px; margin-left:130;'><br>";    */



    /* enviar mensagem de texto */
    /* $pametro = (object) array(
        "instancia" => "financeiro-01",
        "number" => "5516997141457@c.us",
        "msg" => "🙌 Enviando novamente, realizando teste</del> através da WAPI (api de integração com whatsapp)  ... 🙌🙌🙌🙌🙌"
    );    
    $retorno = $wapi->sendmensagemTexto($pametro); */


     /* enviar mensagem de texto e arquivo (imagem, docs, pdf, png, jpeg, audios */
     $pametro = (object) array(
        "instancia" => "financeiro-01",
        "number" => "5516997141457@c.us",
        "msg" => "🙌 Olá estou enviando a foto da minha arvore...",
        "tipo" => "arvore-ipe-amarelo.jpg",
        "arquivo" => "https://www.tecnologiaefloresta.com.br/imagens/uploads/2016/06/arvore-amarela.jpg"
    );    
    $retorno = $wapi->sendMedia($pametro);

    

    echo "{'retorno':".json_encode($retorno)."}";



?>