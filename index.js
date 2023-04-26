const express = require("express");
const fs=require("fs");
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const {Client} = require('pg');

var client= new Client({database:"site",
        user:"vlad1",
        password:"parola",
        host:"localhost",
        port:5432});
client.connect();
client.query("select * from lab8_16", function(err,rez){
    console.log("eroare:", err);
    console.log("rezultat",rez);
})


obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup")

}
app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

vectorFoldere=["temp", "temp1", "backup"];

for(let folder of vectorFoldere){
    //let caleFolder=__dirname+"/"+folder//
    let caleFolder=path.join(__dirname,folder);
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder)
    }
}

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        let vectorCale=caleScss.split("\\")
        let numeFisExt=vectorCale[vectorCale.length-1];
        let numeFis= numeFisExt.split(".")[0]
        caleCss=numeFis+".css";
    }
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss)
    if(!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss)
        //avem cai absolute in caleScss si caleCss
    let vectorCale=caleCss.split("\\"); 
    numeFisCss=vectorCale[vectorCale.length-1];
    if(fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss,path.join(obGlobal.folderBackup,numeFisCss))
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


app.use(/^\/resurse(\/[a-zA-Z0-9]*)*$/, function(req,res){
    afiseazaEroare(res,403);
});

app.get("/favicon.ico",function(req,res){
    res.sendFile(__dirname+"/resurse/ico/favicon.ico");
})

app.get("/ceva", function(req, res){
    console.log("cale:",req.url)
    res.send("altceva ip:"+req.url);
})

app.get(["/index","/","/home"], function(req, res){
    res.render("pagini/index", {ip: req.ip, imagini: obGlobal.obImagini.imagini});
})

app.get("/*.ejs",function(req,res){
    afiseazaEroare(res,400);
})


app.get("/*",function(req,res){
    try{
    console.log(req.url);
    res.render("pagini"+req.url, function(err, rezRandare){
        if (err) {
            console.log(err);
            if (err.message.startsWith("Failed to lookup view")) {
                //afiseazaEroare(res,{_identificator:404,_titlu:"ceva"});
                afiseazaEroare(res,404,"Eroare 404");
            }
            else{
                afiseazaEroare(res);
            }
        }else{
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
    var continut=fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
    console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    for(let eroare of vErori){
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
    if(eroare){
        let titlu1= _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
        res.status(eroare.identificator).render("pagini/eroare",{titlu:titlu1,text:text1,imagine:imagine1});
        else
        res.render("pagini/eroare",{titlu:titlu1,text:text1,imagine:imagine1});
    }
    else{
        var errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare",{titlu:errDef.titlu,text:errDef.text,imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
}


app.listen(8080);
console.log("Serverul a pornit");