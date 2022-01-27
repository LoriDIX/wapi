'use strict'

const puppeteer = require('puppeteer');
const fs = require('fs');

exports.remove_caches = async function(instancia){


    return new Promise( async (resolve, reject) => {
            var path = "./tokens/" + instancia + ".data.json"; 
            var flag_dir = fs.existsSync(path);
            console.log("Pasta de sessão existe? " + flag_dir);

          if (flag_dir == true){   
            
                try{
                    console.log("Removendo pasta de sessão...")
                    /* remover pasta do cache da instancia */
                    fs.rmdirSync(path, { recursive: true });

                    resolve(true);

                }catch(err){
                    console.log("Erro ao tentar remover a pasta de sessão: " + err);
                    reject(false)
                }      

            }

    }); /* fim promise */

}