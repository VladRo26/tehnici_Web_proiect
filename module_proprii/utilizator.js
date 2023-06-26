const AccesBD=require('./accesbd.js');
const parole=require('./parole.js');

const {RolFactory}=require('./roluri.js');
const crypto=require("crypto");
const nodemailer=require("nodemailer");


/**
 * @type {string} - tpiul conexiunii cu baza de date
 * @type {string} - numele tabelului
 * @type {string} - parola pt criptare
 * @type {string} - server-ul de email folosit pt trimiterea email-urilor
 * @type {number} - lungimea codului pt generarea token-ului
 * @type {string} - numele sau URL-ul domeniului
 * */


class Utilizator{
    //tip conexiune conectam la baza de date locala
    static tipConexiune="local";
    static tabel="utilizatori"
    static parolaCriptare="tehniciweb";
    static emailServer="testwebturis@gmail.com";
    static lungimeCod=64;
    static numeDomeniu="localhost:8080";
    #eroare;
    //camp privat static

    /**
     * Creeaza o instanta a clasei Utilizator
     * @param {number} id - id
     * @param {string} username - username
     * @param {string} nume - nume;e
     * @param {string} prenume - prenumele
     * @param {string} email - mail-ul userului
     * @param {string} parola - parola userului
     * @param {object} rol - rolul userului
     * @param {string} culoare_chat culoarea mesajului, standard, negru
     * @param {string} poza - calea pozei de profil
     * */


    constructor({id, username, nume, prenume, email, parola, rol, culoare_chat="black", poza}={}) {
        this.id=id;

        //optional sa facem asta in constructor
        //verific daca exista username
        try{
        if(this.checkUsername(username))
            this.username = username;
        }
        catch(e){ this.#eroare=e.message}

        //in argument[0] o sa sa avem obiectul cu id,username,nume..., cu prop iteram prin ele
        //e un fel de vector, dar nu e vector
        for(let prop in arguments[0]){
            this[prop]=arguments[0][prop]
        //setam fiecare proprietatea cu valorea iterata
        }
        //laum pe rand fiecare element din obiect, copiem argumentele in utilizatori si ii atribuim o valoare

        //daca am setat rolul
        if(this.rol)
        //daca codul exista atunci creez o instanta, ori primeste un string Admin ori o instanta a lui Admin
            this.rol=this.rol.cod? RolFactory.creeazaRol(this.rol.cod):  RolFactory.creeazaRol(this.rol);
        console.log(this.rol);

        this.#eroare="";
        //aici verificam daca am setat roulul, daca exista creez o instanta a rolului
    }

     /**
     * @param {string} nume - numele care trebuie verificat
     * @returns {boolean} - adevarat daca numele este valid, fals altfel
     * */

    checkName(nume){
        return nume!="" && nume.match(new RegExp("^[A-Z][a-z]+$")) ;
    }

      /**
     * @param {string} nume - numele care trebuie setat*/
    set setareNume(nume){
        if (this.checkName(nume)) this.nume=nume
        else{
            throw new Error("Nume gresit")
        }
    }

    /*
    * folosit doar la inregistrare si modificare profil
    */
     /**
     * @param {string} username - username-ul care trebuie setat
     * */
    set setareUsername(username){
        if (this.checkUsername(username)) this.username=username
        else{
            throw new Error("Username gresit")
        }
    }

    //verificam ca username ul este conform formatului
      /**
     * @param {string} username - username-ul care trebuie verificat
     * @returns {boolean} - adevarat daca username-ul este valid, fals altfel
     * */
    checkUsername(username){
        return username!="" && username.match(new RegExp("^[A-Za-z0-9#_./]+$")) ;
    }

    /**
     * @param {string} parola - parola care va fi criptata
     * @returns {string} - parola criptata
     * */
    static criptareParola(parola){
        return crypto.scryptSync(parola,Utilizator.parolaCriptare,Utilizator.lungimeCod).toString("hex");
        //cripteaza parola sincron, folosind 2 stringuri, una este parola si una este un alt string, parola de criptare find tehniciweb
    }


    //e apelata de app.post
    salvareUtilizator(){
        //avem utilizatorul deja construit, aici il punem in tabel
        let parolaCriptata=Utilizator.criptareParola(this.parola);
        let utiliz=this;
        //tokenul ce apare cand confirmam mailul si apare si in tabel
        let token=parole.genereazaToken(100);
        //inseram in tabelul de utilizator campurile de mai jos
        AccesBD.getInstanta(Utilizator.tipConexiune).insert({tabel:Utilizator.tabel,
            
            campuri:{
                username:this.username,
                nume: this.nume,
                prenume:this.prenume,
                parola:parolaCriptata,
                email:this.email,
                culoare_chat:this.culoare_chat,
                cod:token,
                poza:this.poza}
            }, function(err, rez){
            if(err)
                console.log(err);
            
            //aici trimitem un mail
            utiliz.trimiteMail("Te-ai inregistrat cu succes","Username-ul tau este "+utiliz.username,
            `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p> <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`,
            //
            )
        });
    }
//xjxwhotvuuturmqm

/**
     * @param {string} subiect - subiectul email-ului
     * @param {string} mesajText - continutul text al email-ului
     * @param {string} mesajHtml - continutul HTML al email-ului
     * @param {Array<object>} [atasamente=[]] - un vector cu atasamentele email-ului
     * */

    async trimiteMail(subiect, mesajText, mesajHtml, atasamente=[]){
        //creez un obiect care transmite mesajele
        var transp= nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth:{//date login 
                user:Utilizator.emailServer,
                pass:"cjgvjezzfedfilim"
            },
            tls:{
                rejectUnauthorized:false
            }
        });
        //genereaza html
        //await asteapta rezultatul, apelam metoda de sendMail
        await transp.sendMail({
            from:Utilizator.emailServer,
            to:this.email, //TO DO
            subject:subiect,//"Te-ai inregistrat cu succes",
            text:mesajText, //"Username-ul tau este "+username
            html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
            attachments: atasamente
        })
        console.log("trimis mail");
    }

       /**
    * @param {string} username - The username of the user to retrieve.
    * @returns {Promise<Utilizator|null>} - A promise that resolves to the retrieved user or null if not found.
    * */
   
    static async getUtilizDupaUsernameAsync(username){
        if (!username) return null;
        try{
            let rezSelect= await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync(
                {tabel:"utilizatori",
                campuri:['*'],
                conditiiAnd:[`username='${username}'`]
            });
            if(rezSelect.rowCount!=0){
                return new Utilizator(rezSelect.rows[0])
            }
            else {
                console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
                return null;
            }
        }
        catch (e){
            console.log(e);
            return null;
        }
        
    }
    //daca exista in baza de date va da eroare
     /**
     * @param {string} username - username
     * @param {object} obparam - obiectul pasat ca parametru
     * @param {function} proceseazaUtiliz - o functie callback care proceseaza utulizatorul
     * */
    static getUtilizDupaUsername (username,obparam, proceseazaUtiliz){
        //ori da eroare , ori creeaza un obiect de tip utilizator
        if (!username) return null;
        let eroare=null;
        //
        AccesBD.getInstanta(Utilizator.tipConexiune).select({tabel:"utilizatori",campuri:['*'],conditiiAnd:[`username='${username}'`]}, function (err, rezSelect){
            let u=null;
            if(err){
                //DACA A DAT EROARE BAZA DE DATE SETAM EROARE =-2
                console.error("Utilizator:", err);
                console.log("Utilizator",rezSelect.rows.length);
                //throw new Error()
                eroare=-2;
            }
            else if(rezSelect.rowCount==0){
                eroare=-1;
                //DACA NU RETURNEAZA NIMIC SELECTUL
            }
            //constructor({id, username, nume, prenume, email, rol, culoare_chat="black", poza}={})
            else{
                u= new Utilizator(rezSelect.rows[0])
                //creeaza nou utilizator daca nu da eroare
            }
            proceseazaUtiliz(u, obparam, eroare);
            //E FOLOSIT IN INDEX.JS
        });
    }
      /**
     * @param {Symbol} drept - verifica daca rolul respectiv are dreptul.
     * @returns {boolean} - returneaza true daca are, false daca nu.
     * */

    areDreptul(drept){
        return this.rol.areDreptul(drept);
    }
}
module.exports={Utilizator:Utilizator}