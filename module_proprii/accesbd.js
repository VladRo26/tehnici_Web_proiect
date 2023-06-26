/*

ATENTIE!
inca nu am implementat protectia contra SQL injection
*/

const {Client, Pool}=require("pg");


//aici definim clasa, nu avem nevoie de destructori in js ca se fac automat
class AccesBD{
    //static este pentru toate instantele, nu depinde de obiectele din clasa
    static #instanta=null;//# inseamna private
    static #initializat=false;

    //aici definim constructorul
    constructor() {
        //avem singleton, putem sa facem doar o instanta a clasei
        if(AccesBD.#instanta){
            throw new Error("Deja a fost instantiat");
        }
        else if(!AccesBD.#initializat){
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    initLocal(){
        //ne logam la baza de date, printr o conexiune unica prin care trimitem queery
        this.client= new Client({database:"site",
            user:"vlad1", 
            password:"parola", 
            host:"localhost", 
            port:5432});
        // this.client2= new Pool({database:"laborator",
        //         user:"irina", 
        //         password:"irina", 
        //         host:"localhost", 
        //         port:5432});
        this.client.connect();
        //ne conectam
    }

    //un getter 
    getClient(){
        if(!AccesBD.#instanta ){
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     * 
     * /

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} un obiect cu datele pentru query
     * @returns {AccesBD}
     */

    //se asteapta sa primeasca un obiect cu init, cu o valoare default, daca primim un obiect vid, o sa cosidere ca a primit obiectul cu local
    static getInstanta({init="local"}={}){

        console.log(this);//this-ul e clasa nu instanta pt ca metoda statica
        //asa definim un obiect pentru instanta, nu static
        //prima oara va fi null
        if(!this.#instanta){
            // o sa o initializeze prima oara
            this.#initializat=true;
            //aici construim instanta unica a clasei
            this.#instanta=new AccesBD();

            //initializarea poate arunca erori
            //vom adauga aici cazurile de initializare 
            //pentru baza de date cu care vrem sa lucram
            try{
                //verificam daca este local, sau daca avem alt caz
                switch(init){
                    case "local":this.#instanta.initLocal();
                }
                //daca ajunge aici inseamna ca nu s-a produs eroare la initializare
                
            }
            catch (e){
                console.error("Eroare la initializarea bazei de date!");
            }

        }
        return this.#instanta;
        //ori cream una noua, ori o returnam pe cea veche
    }




    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */


    
    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */

    //primim un obiect ce are urmatoarele proprietati, tabelul , coloanele si conditiile where si and
    //callback ul este functia cu err si Rez, ca sa facem ceva cu rezultatul
    select({tabel="",campuri=[],conditiiAnd=[]} = {}, callback, parametriQuery=[]){
        //string in care punem conditia where
        let conditieWhere="";
        //verificam daca avem where
        if(conditiiAnd.length>0)
        //vom pune where si apoi x and y
            conditieWhere=`where ${conditiiAnd.join(" and ")}`; 
        //aici facem selectul si pune, , intre campuri si apoi conditia where
        let comanda=`select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda);
        /*
        comanda=`select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2;
        this.client.query(comanda,[val1, val2],callback)

        */
        this.client.query(comanda,parametriQuery, callback)
    }
    //o functie asincrona ce returneaza rezultatul
    async selectAsync({tabel="",campuri=[],conditiiAnd=[]} = {}){
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        
        let comanda=`select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:",comanda);
        try{
            let rez=await this.client.query(comanda);
            console.log("selectasync: ",rez);
            return rez;
        }
        catch (e){
            console.log(e);
            return null;
        }
    }
    //camp : valoare

    //AccessBd.getInstanta().insert({tabel:"produse", campuri:{nume:"savarina",pret:10}})
    insert({tabel="",campuri={}} = {}, callback){

             /*
        campuri={
            nume:"savarina",
            pret: 10,
            calorii:500
        }
        */  
        console.log("-------------------------------------------")
        //avem chei si valori, proprietatea este cheia
        console.log(Object.keys(campuri).join(","));
        //separam cheia de valoare a={x:100, y:200}
        //object.keys(a) e x,y
        console.log(Object.values(campuri).join(","));
        //object.keys(a) e 10,20
        //inseram in tabel
        //facem join sa punem, intre randuri si apoi mapam fiecare valoare a vectorului si ii pune ' la stanga si la dreapta, deoarece este valabil si pentru stringuri si pentru orice
        let comanda=`insert into ${tabel}(${Object.keys(campuri).join(",")}) values ( ${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }

     /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */   
    // update({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    //     if(campuri.length!=valori.length)
    //         throw new Error("Numarul de campuri difera de nr de valori")
    //     let campuriActualizate=[];
    //     for(let i=0;i<campuri.length;i++)
    //         campuriActualizate.push(`${campuri[i]}='${valori[i]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     console.log(comanda);
    //     this.client.query(comanda,callback)
    // }

    update({tabel="",campuri={}, conditiiAnd=[]} = {}, callback, parametriQuery){
        let campuriActualizate=[];
        for(let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }

    // updateParametrizat({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    //     if(campuri.length!=valori.length)
    //         throw new Error("Numarul de campuri difera de nr de valori")
    //     let campuriActualizate=[];
    //     for(let i=0;i<campuri.length;i++)
    //         campuriActualizate.push(`${campuri[i]}=$${i+1}`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111",comanda);
    //     this.client.query(comanda,valori, callback)
    // }


    //TO DO
    // updateParametrizat({tabel="",campuri={}, conditiiAnd=[]} = {}, callback, parametriQuery){
    //     let campuriActualizate=[];
    //     for(let prop in campuri)
    //         campuriActualizate.push(`${prop}='${campuri[prop]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     this.client.query(comanda,valori, callback)
    // }

    delete({tabel="",conditiiAnd=[]} = {}, callback){
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        
        let comanda=`delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda,callback)
    }

    query(comanda, callback){
        this.client.query(comanda,callback);
    }

}

module.exports=AccesBD;
//importam cu requaire in programul principal adica in index.js