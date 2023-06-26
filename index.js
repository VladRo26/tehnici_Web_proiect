const express = require("express");
const fs=require("fs");
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const {Client} = require('pg');
const AccesBD= require("./module_proprii/accesbd.js");


const formidable=require("formidable");
const {Utilizator}=require("./module_proprii/utilizator.js")
const session=require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");

const QRCode= require('qrcode');
const puppeteer=require('puppeteer');
const mongodb=require('mongodb');
const helmet=require('helmet');
const xmljs=require('xml-js');

// const request=require("request");

// var url = "mongodb://localhost:27017";//pentru versiuni mai vechi de Node
// var url = "mongodb://0.0.0.0:27017";
 
// obGlobal.clientMongo.connect(url, function(err, bd) {
//     if (err) console.log(err);
//     else{
//         obGlobal.bdMongo = bd.db("proiect_web");
//     }
// });

 
AccesBD.getInstanta().select(
    {tabel:"masini",
    campuri:["nume", "pret", "culoare"],
    conditiiAnd:["pret > 10000"]},
    //functia callback pe care o trimit si clientului
    function (err, rez){
        console.log(err);
        console.log(rez);
    }
)

var client= new Client({database:"site",
        user:"vlad1",
        password:"parola",
        host:"localhost",
        port:5432});
client.connect();
client.query("select * from masini", function(err,rez){
    console.log("eroare:", err);
    console.log("rezultat",rez);
});



obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
    optiuniMeniu: [],
    // protocol:"http://",
    // numeDomeniu:"localhost:8080",
    // clientMongo:mongodb.MongoClient,
    // bdMongo:null
}


client.query("select * from unnest(enum_range(null::tipuri_caroserie))", function(err,rezCategorie){
    if(err){
        console.log(err);
    }
    else{
        obGlobal.optiuniMeniu=rezCategorie.rows
    }
});




app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

vectorFoldere=["temp", "temp1", "backup","poze_uploadate"];


app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune, se distruge cand isi da logout
    resave: true,
    saveUninitialized: false
}));

for(let folder of vectorFoldere){
    //let caleFolder=__dirname+"/"+folder//
    let caleFolder=path.join(__dirname,folder);
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder)
    }
}

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        // let vectorCale=caleScss.split("\\")
        // let numeFisExt=vectorCale[vectorCale.length-1];
        let numeFisExt=path.basename(caleScss);
        let numeFis= numeFisExt.split(".")[0]
        caleCss=numeFis+".css";
    }

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)){
        fs.mkdirSync(caleBackup,{recursive:true})
    }

    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss)
    if(!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss)
        //avem cai absolute in caleScss si caleCss
    // let vectorCale=caleCss.split("\\"); 
    // numeFisCss=vectorCale[vectorCale.length-1];
    let numeFisCss=path.basename(caleCss);
    if(fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss,path.join(obGlobal.folderBackup,"resurse/css",numeFisCss))
    }
    rez=sass.compile(caleScss,{"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css);
    console.log("Compilare SCSS",rez);
}

// compileazaScss("a.scss");
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if(path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment,numeFis);
    if(eveniment=="change" || eveniment=="rename")
    {
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if(fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})

app.set("view engine","ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));

app.use("/node_modules", express.static(__dirname+"/node_modules"));

app.use("/*",function(req,res,next){
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
    res.locals.Drepturi=Drepturi;
    if (req.session.utilizator){
        req.utilizator=res.locals.utilizator=new Utilizator(req.session.utilizator);
    }    
    //trimitem drepturile catre pagini


    next();
})

app.use(["/produse_cos","/cumpara"],express.json({limit:'2mb'}));//obligatoriu de setat pt request body de tip json

app.use(["/contact"], express.urlencoded({extended:true}));

app.use(/^\/resurse(\/[a-zA-Z0-9]*)*$/, function(req,res){
    //daca se cere ceva din resurse
    afiseazaEroare(res,403);
});

app.get("/favicon.ico",function(req,res){
    res.sendFile(__dirname+"/resurse/ico/favicon.ico");
})

app.get("/ceva", function(req, res){
    console.log("cale:",req.url)
    res.send("altceva ip:"+req.url);
})

app.get(["/index","/","/home","/login"], function(req, res){

    let sir=req.session.mesajLogin;
    req.session.mesajLogin=null;
    res.render("pagini/index", {ip: req.ip, imagini: obGlobal.obImagini.imagini, mesajLogin:sir});

})


app.get("/produse",function(req, res){

    //functia modificata de mine
    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
    client.query("select * from unnest(enum_range(null::tipuri_caroserie))", function(err,rezCategorie){
        if(err){
            console.log(err);
        }
        else{
            let conditieWhere="";
            if(req.query.tip)
            conditieWhere=` where tipuri_caroserie='${req.query.tip}'`

            client.query("select * from masini "+conditieWhere , function( err, rez){
                console.log(300)
                if(err){
                    console.log(err);
                    afiseazaEroare(res, 2);
                }
                else{
                    client.query("select MIN(pret) AS min_price , MAX(pret) AS max_price FROM masini",function(err,rezPret){
                        if (err) {
                            console.log(err);
                            afiseazaEroare(res, 2);
                        }else{
                            console.log(rez);
                    
                            res.render("pagini/produse", {
                                produse:rez.rows, 
                                optiuni:rezCategorie.rows,
                                pret_minim:rezPret.rows[0].min_price,
                                pret_maxim:rezPret.rows[0].max_price});
                        }
                    });

                }
            });
        }
    });

});





app.get("/produs/:id",function(req, res){
    console.log(req.params);
   
    client.query(`select * from masini where id=${req.params.id}`, function( err, rezultat){
        if(err){
            console.log(err);
            afiseazaEroare(res, 2);
        }
        else
            res.render("pagini/produs", {prod:rezultat.rows[0]});
    });
});



app.post("/inregistrare",function(req, res){
    //sunt definite global la nivelul functiei
    var username;
    var poza;
    console.log("ceva");
    //cream un obiect special care va astepta si va reconstrui datele
    var formular= new formidable.IncomingForm()
    //in momentul in care a venit toate datele si a parsat tot intra in function, 4 pentru ca e ultimul eveniment care e declansats
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        //NAME-URILE DEVIN PROPRIETATI  ALE LUI CAMPURI TEXT, IAR CAMPURIFISIER TOATE INPUTURILE DE TIP FILE
        console.log("Inregistrare:",campuriText);

        console.log(campuriFisier);
        var eroare="";

        //CREAM UN UTILIZATOR NOU
        var utilizNou=new Utilizator();
        try{
            //SI AM PUS IN PROPRIETATILE FOLOSIND SETARI CU =
            utilizNou.setareNume=campuriText.nume;
            //numele functiei e dat ca proprietate a obiectului si ce e dupa egal e dat ca parametru
            utilizNou.setareUsername=campuriText.username;
            utilizNou.email=campuriText.email
            utilizNou.prenume=campuriText.prenume
            
            utilizNou.parola=campuriText.parola;
            utilizNou.culoare_chat=campuriText.culoare_chat;
            utilizNou.poza= poza;
            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function(u, parametru ,eroareUser ){

                if (eroareUser==-1){//nu exista username-ul in BD
                    utilizNou.salvareUtilizator();
                }
                else{
                    eroare+="Mai exista username-ul";
                }

                if(!eroare){
                    //DACA NU AM EROARE SETEZ UN RASPUNS: INREGISTRARE CU SUCCES
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                    
                }
                else
                        //DACA AM EROARE RANDEZ PAGINA DE INREGISTRARE DAR CU MESAJUL ERR   
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
            

        }
        catch(e){ 
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }
    



    });
    //se va declansa LA FIECARE INPUT PE CARE IL PRIMESTE, PENTRU FIECARE NUME DE CAMP SI VALOARE,
    // DATELE VIN DIN NAME DIN FORMULA.EJS, NAME DEVINE VALOAREA PRIMULUI PARAMETRU DIN FUNCTIE
    formular.on("field", function(nume,val){  // 1 
	
        console.log(`--- ${nume}=${val}`);
		//SALVAM IN VARIABILA USERNAME USERNAME CA SA IL FOLOSIM IN FILEBEGIN
        if(nume=="username")
            username=val;
    }) 
    //O SA FIE PENTRU INPUTURILE DE TIP FISIER, FISIER O SA FIE UN OBIECT SPECIAL CREAT DE FORMIDABLE,
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
		
        console.log(nume,fisier);
		//TO DO in folderul poze_uploadate facem folder cu numele utilizatorului
        let folderUser=path.join(__dirname, "poze_uploadate",username); 
        //folderUser=__dirname+"/poze_uploadate/"+username
        console.log(folderUser);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser);
            //LOCATIA UNDE SE UPLOADEAZA POZA, CREAM FOLDERUL DACA NU EXISTA, IAR IN LOCATIA UNDE SE UPLODEAZA POAZA
            //CONCTANENAM LA FOLDERUL USERULUI, NUMELE ORIGINAL AL POZEI
        fisier.filepath=path.join(folderUser, fisier.originalFilename)

        poza=fisier.originalFilename
        //fisier.filepath=folderUser+"/"+fisier.originalFilename

    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    }); 
});


//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
//:USERNAME E PARAMETRU CE POATE FI ACCESAT CU REQUEST.PARAM.USERNAME. PARAMETRII II OBTINEM DIN LINNKK
app.get("/cod/:username/:token",function(req,res){
    console.log(req.params);
    try {
        //getUtilizDupaUsername primeste usernmae, mai primeste un obiect si o functie callback cu obiectul ca parametru
        //in functia callback daca exista utilizatorul aveam ceva setat in u si ii facem update ca sa confirmam mailul
        Utilizator.getUtilizDupaUsername(req.params.username,{res:res,token:req.params.token} ,function(u,obparam){
            AccesBD.getInstanta().update(
                {tabel:"utilizatori",
                campuri:{confirmat_mail:'true'}, 
                conditiiAnd:[`cod='${obparam.token}'`]}, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        afisareEroare(res,3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs");
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        renderError(res,2);
    }
})

app.post("/login",function(req, res){
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){
        Utilizator.getUtilizDupaUsername (campuriText.username,{
            req:req,
            res:res,
            parola:campuriText.parola
        }, function(u, obparam ){

            let parolaCriptata=Utilizator.criptareParola(obparam.parola);
            if(u.parola==parolaCriptata && u.confirmat_mail ){
                u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                obparam.req.session.utilizator=u;
                
                obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                obparam.res.redirect("/index");
                //obparam.res.render("/login");
            }
            else{
                console.log("Eroare logare")
                obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.res.redirect("/index");
                //metoda redirect da redirect catre index
            }
        })
    });
});


app.post("/profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        randeazaEroare(res,403,)
        res.render("pagini/eroare_generala",{text:"Nu sunteti logat."});
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
       
        var parolaCriptata=Utilizator.criptareParola(campuriText.parola);
        // AccesBD.getInstanta().update(
        //     {tabel:"utilizatori",
        //     campuri:["nume","prenume","email","culoare_chat"],
        //     valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`,`${campuriText.culoare_chat}`],
        //     conditiiAnd:[`parola='${parolaCriptata}'`]
        // },   
        AccesBD.getInstanta().updateParametrizat(
            {tabel:"utilizatori",
            campuri:["nume","prenume","email","culoare_chat"],
            valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`,`${campuriText.culoare_chat}`],
            conditiiAnd:[`parola='${parolaCriptata}'`,`username='${campuriText.username}'`]
        },          
        function(err, rez){
            if(err){
                console.log(err);
                afisareEroare(res,2);
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                //actualizare sesiune
                console.log("ceva");
                req.session.utilizator.nume= campuriText.nume;
                req.session.utilizator.prenume= campuriText.prenume;
                req.session.utilizator.email= campuriText.email;
                req.session.utilizator.culoare_chat= campuriText.culoare_chat;
                res.locals.utilizator=req.session.utilizator;
            }
 
 
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
 
        });
       
 
    });
});

app.get("/useri", function(req, res){
   
    if(req?.utilizator?.areDreptul?.(Drepturi.vizualizareUtilizatori)){
        AccesBD.getInstanta().select({tabel:"utilizatori", campuri:["*"]}, function(err, rezQuery){
            console.log(err);
            res.render("pagini/useri", {useri: rezQuery.rows});
        });
    }
    else{
        afisareEroare(res, 403);
    }
});


app.post("/sterge_utiliz", function(req, res){
    //verificam daca are dreptul de a sterge utilizatori
    if(req?.utilizator?.areDreptul?.(Drepturi.stergereUtilizatori)){
        var formular= new formidable.IncomingForm();

        
        formular.parse(req,function(err, campuriText, campuriFile){
           
                AccesBD.getInstanta().delete({tabel:"utilizatori", conditiiAnd:[`id=${campuriText.id_utiliz}`]}, function(err, rezQuery){
                console.log(err);
                res.redirect("/useri");
            });
        });
    }else{
        afisareEroare(res,403);
    }
})

app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout");
});


app.post("/produse_cos",function(req, res){
    console.log(req.body);
    if(req.body.ids_prod.length!=0){
        //TO DO : cerere catre AccesBD astfel incat query-ul sa fi `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
        //aici selectam din tabel produsele cu id ul vectorul de iduri
        AccesBD.getInstanta().select({tabel:"masini", campuri:"nume,descriere,pret,marca,imagine".split(","),conditiiAnd:[`id in (${req.body.ids_prod})`]},
        function(err, rez){
            if(err)
                res.send([]);
            else
                res.send(rez.rows); 
        });
}
    else{
        res.send([]);
    }
 
});


//aici se creaza codul qr
cale_qr=__dirname+"/resurse/imagini/qrcode";
if (fs.existsSync(cale_qr))
//daca exista calea deja o stergem
  fs.rmSync(cale_qr, {force:true, recursive:true});
fs.mkdirSync(cale_qr);
//dupa ce l am sters il cream la loc
client.query("select id from masini", function(err, rez){
    for(let prod of rez.rows){
        let cale_prod=obGlobal.protocol+obGlobal.numeDomeniu+"/produs/"+prod.id;
        //console.log(cale_prod);
        QRCode.toFile(cale_qr+"/"+prod.id+".png",cale_prod);
        //primeste calea imaginii si calea pe care trebuie sa o codifice
    }
});

//primeste stringul si numele fisierului unde vreau sa fac pdf
async function genereazaPdf(stringHTML,numeFis, callback) {
    //creez un proces chrome in backgrounds, care e un obiect special pappeteer
    const chrome = await puppeteer.launch();
    const document = await chrome.newPage();
    console.log("inainte load")
    //waitUntil: load sa astepte pana cand s au incarcat si imaginile
    await document.setContent(stringHTML, {waitUntil:"load"});
    
    console.log("dupa load")
    await document.pdf({path: numeFis, format: 'A4'});
    await chrome.close();
    if(callback)
        callback(numeFis);
}

app.post("/cumpara",function(req, res){
    console.log(req.body);
    console.log("Utilizator:", req?.utilizator);
    console.log("Utilizator:", req?.utilizator?.rol?.areDreptul?.(Drepturi.cumparareProduse));
    console.log("Drept:", req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse));
    if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)){
        AccesBD.getInstanta().select({
            tabel:"masini",
            campuri:["*"],
            conditiiAnd:[`id in (${req.body.ids_prod})`]
        }, function(err, rez){
            if(!err  && rez.rowCount>0){
                console.log("produse:", rez.rows);
                let rezFactura= ejs.render(fs.readFileSync("./views/pagini/factura.ejs").toString("utf-8"),{
                    protocol: obGlobal.protocol, 
                    domeniu: obGlobal.numeDomeniu,
                    utilizator: req.session.utilizator,
                    produse: rez.rows

                });
                console.log(rezFactura);
                //getTIME, nr de secunde de la 1970
                let numeFis=`./temp/factura${(new Date()).getTime()}.pdf`;
                genereazaPdf(rezFactura, numeFis, function (numeFis){
                    mesajText=`Stimate ${req.session.utilizator.username} aveti mai jos rezFactura.`;
                    mesajHTML=`<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos rezFactura.`;
                    req.utilizator.trimiteMail("Factura", mesajText,mesajHTML,[{
                        //atasamente din trimiteMail, redenumim doar pe mail numele
                        filename:"factura.pdf",
                        content: fs.readFileSync(numeFis)
                    }] );
                    res.send("Totul e bine!");
                });
                rez.rows.forEach(function (elem){ elem.cantitate=1});
                let jsonFactura= {
                    //data curenta
                    data: new Date(),
                    //cine a cumparat
                    username: req.session.utilizator.username,
                    //vectorul de produse
                    produse:rez.rows
                }
                if(obGlobal.bdMongo){
                    obGlobal.bdMongo.collection("facturi").insertOne(jsonFactura, function (err, rezmongo){
                        if (err) console.log(err)
                        else console.log ("Am inserat factura in mongodb");

                        obGlobal.bdMongo.collection("facturi").find({}).toArray(
                            function (err, rezInserare){
                                if (err) console.log(err)
                                else console.log (rezInserare);
                        })
                    })
                }
            }
        })
    }
    else{
        res.send("Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!");
    }
    
});

app.get("/grafice", function(req,res){
    if (! (req?.session?.utilizator && req.utilizator.areDreptul(Drepturi.vizualizareGrafice))){
        afisEroare(res, 403);
        return;
    }
    res.render("pagini/grafice");

})

app.get("/update_grafice",function(req,res){
    obGlobal.bdMongo.collection("facturi").find({}).toArray(function(err, rezultat) {
        res.send(JSON.stringify(rezultat));
    });
})

app.get("/galerie_animata", function (req, res) {
    let nrImagini = randomInt(6, 12);
    if (nrImagini % 2 != 0)
        nrImagini++;

    let fisScss = path.join(__dirname, "Resurse/scss/galerie_animata.scss");
    let liniiFisScss = fs.readFileSync(fisScss).toString().split('\n');

    let stringImg = "$nrImg: " + nrImagini + ";";
    liniiFisScss.shift();
    liniiFisScss.unshift(stringImg);
    fs.writeFileSync(fisScss, liniiFisScss.join('\n'))

    res.render("pagini/galerie_animata", { imagini: obGlobal.obImagini.imagini, nrImagini: nrImagini });
});


app.get("/*.ejs",function(req,res){
    afiseazaEroare(res,400);
})


app.get("/*",function(req,res){
    //app use trb sa se potriveasca doar cu inceputul, iar app get cu toata calea
    try{
    console.log(req.url);
    //res.render compileaza ejs, executa js din ejs, se uita automat in folderul views
    //req.url reprezinta calea ceruta de client
    //req.url- se obtine ce s-a introdus dupa numele domeniului , primul parametru este un string cu calea apare si cu /, al doilea parametru este locals, iar al treilea este o functie callback,
    // ce este apelata dupa ce termina randarea, o sa fie setat ori err ori rezRandare
    res.render("pagini"+req.url, function(err, rezRandare){
        if (err) {
            console.log(err);
            //daca am eroare
            //daca mesajul de eroarea incepe cu ... inseamna ca avem 404
            if (err.message.startsWith("Failed to lookup view")) {
                //afiseazaEroare(res,{_identificator:404,_titlu:"ceva"});
                afiseazaEroare(res,404,"Eroare 404");
            }
            else{
                afiseazaEroare(res);
            }
        }else{
            //daca nu am eroare, trimit pagina, cu codul html al pagini
            res.send(rezRandare);
        }

    });
    }
    catch(err){
        if (err.message.startsWith("Cannot find module")) {
            //afiseazaEroare(res,{_identificator:404,_titlu:"ceva"});
            afiseazaEroare(res,404,"Eroare");
        }
        else{
            afiseazaEroare(res);
        }
    }
})


function initializeazaErori(){
    //sincron si asincron, cele asincrone nu se realizeaza fix in momentul apelului
    var continut=fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
    console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    //o sa identifice proprietatile din fisierul json
    let vErori=obGlobal.obErori.info_erori;
    for(let eroare of vErori){
        //iterez prin vectorul de erori ce este o proprietate a obiectului JSON si scriem calea completa catre imagine
        //caile o sa inceapa cu /
        eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }

}
initializeazaErori()



function initializeazaImagini(){
    var continut=fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie,"mediu");
    let caleAbsMic=path.join(__dirname,obGlobal.obImagini.cale_galerie,"mic");
    console.log(caleAbsMediu);
    console.log(caleAbsMic);
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    if (!fs.existsSync(caleAbsMic))
        fs.mkdirSync(caleAbsMic);


    for(let imag of vImagini){
        //eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier)
        let caleFisMediuAbs=path.join(caleAbsMediu,numeFis+".webp")
        let caleFisMicAbs=path.join(caleAbsMic,numeFis+".webp")
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        sharp(caleFisAbs).resize(200).toFile(caleFisMicAbs);
        imag.fisier_mic=path.join("/",obGlobal.obImagini.cale_galerie,"mic",numeFis+".webp")
        imag.fisier_mediu=path.join("/",obGlobal.obImagini.cale_galerie,"mediu",numeFis+".webp")
        imag.fisier=path.join("/",obGlobal.obImagini.cale_galerie, imag.fisier)

    }
}
initializeazaImagini()

/*
daca titlul este setat, se ia cel din argument
daca nu e setat, se ia cel din json
daca e setat titlu din json se ia cel cu valoarea default
*/

function afiseazaEroare(res,_identificator,_titlu="titlu default",_text,_imagine){
    let vErori=obGlobal.obErori.info_erori
    let eroare =vErori.find(function(elem){
        return elem.identificator==_identificator;
    });
    //returnez acea eroare ce are identificatorul cerut, daca gaseste eroarea seteaza proprietatiile erorii
    if(eroare){
        let titlu1= _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
        //daca eroarea are un cod 403,404
        //daca pentru eroarea respectiva trimitem si identificatorul vom trimite si statusul
        res.status(eroare.identificator).render("pagini/eroare",{titlu:titlu1,text:text1,imagine:imagine1});
        else
        //daca nu are status
        res.render("pagini/eroare",{titlu:titlu1,text:text1,imagine:imagine1});
        //aici se trimite raspunsul cu obiectul din locals, proprietate=valoare
    }
    else{
        var errDef=obGlobal.obErori.eroare_default;
        //daca nu gasesc eroarea o sa punem o eroarea default
        res.render("pagini/eroare",{titlu:errDef.titlu,text:errDef.text,imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
}


// initializari socket.io
const http=require('http')
const socket = require('socket.io');
const server = new http.createServer(app);  
var io = socket(server);
io = io.listen(server);//asculta pe acelasi port ca si serverul

io.on("connection", (socket) => {  
    console.log("Conectare!");
	//if(!conexiune_index)
	//	conexiune_index=socket
    socket.on('disconnect', () => {conexiune_index=null;console.log('Deconectare')});
});

app.post('/mesaj', function(req, res) {
    var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
        console.log("primit mesaj");
        console.log(fields);
		io.sockets.emit('mesaj_nou', fields.nume, fields.culoare, fields.mesajs);
        res.send("ok");
    });
});

server.listen(8080);
console.log("Serverul a pornit");