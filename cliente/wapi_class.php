<?php
/* --- funções para chamada de comando da api ---*/

class wapi_class{
        public $host_api;
        
        function __construct(){

            $this->host_api = "http://localhost:3000";

        }


        /* gerar qrcode (gerar instancia) */
        public function setupInstancia($params){
            /* 
                parametros:
                    instancia: (texto de nome da instancia)
            */

            $parametros = (object) array(
                "pars" => $params,
                "url_api" => '/wp/qrcode'
            );
            
            $retorno = $this->curlUtil($parametros);          
            
            return $retorno;

        }


        public function sendmensagemTexto($params){
            /* 
                 "instancia": "jmsoft",
                 "number": "5516997141457@c.us",
                 "msg": "🙌 Enviando novamente, realizando teste</del> através da WAPI (api de integração com whatsapp)  ... 🙌🙌🙌🙌🙌"
            */

            $parametros = (object) array(
                "pars" => $params,
                "url_api" => '/wp/sendMsg'
            );
            
            $retorno = $this->curlUtil($parametros);          
            
            return $retorno;
            
        }

        public function sendMedia($params){

            /* 
                "instancia": "jmsoft", 
                "number": "5516997141457@c.us", 
                "msg": "Ola, fazendo teste de envio de arquivos através da api para Vitor. \n website JMsoft: http://www.jmsofts.com.br ",
                "tipo": "arquivo-exemplo.jpg",
                "arquivo": "https://i.pinimg.com/564x/9b/57/d3/9b57d3e78fcf27af2e5580be05505369.jpg"            
            */

            $parametros = (object) array(
                "pars" => $params,
                "url_api" => '/wp/SendMedia'
            );
            
            $retorno = $this->curlUtil($parametros);          
            
            return $retorno;

        }


        /* util curl */
        public function curlUtil($params){
            /* 
                parametro:
                    pars: parametro da função, 
                    url_api : (função da api) exemplo:  wp/qrcode
            */

            $curl = curl_init();
            
            curl_setopt_array($curl, array(
                CURLOPT_URL => $this->host_api.$params->url_api,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($params->pars),
                CURLOPT_HTTPHEADER => array(
                    'Content-Type: application/json'
                ),
            ));

            $response = json_decode(curl_exec($curl));
           
            curl_close($curl);

            return $response;


        }

}


?>
