
  /**
    * @type {string} - get the type of the role
    * @type {Array<Symbol>} - gets the list of rights associated with the role
    * */

const Drepturi=require('./drepturi.js');

//clasa rol e clasa de baza
class Rol{
    static get tip() {return "generic"}
    static get drepturi() {return []}
    constructor (){
        this.cod=this.constructor.tip;
    }

    areDreptul(drept){ //drept trebuie sa fie tot Symbol
        console.log("in metoda rol!!!!")
        return this.constructor.drepturi.includes(drept); //pentru ca e admin
        //verifica din lista de drepturi daca exista in lista respectiva
    }
}


class RolAdmin extends Rol{
    
    static get tip() {return "admin"}
    constructor (){
        super();
    }

    areDreptul(){
        return true; //pentru ca e admin
    }
}



class RolModerator extends Rol{
    
    static get tip() {return "moderator"}
    static get drepturi() { return [
        Drepturi.vizualizareUtilizatori,
        Drepturi.stergereUtilizatori
    ] }
    constructor (){
        super()
    }
}


class RolClient extends Rol{
    static get tip() {return "comun"}
    static get drepturi() { return [
        Drepturi.cumparareProduse
    ] }
    constructor (){
        super()
    }
}

//primeste un tipul si creaza o instanta a unei clase derivate, tipul este un string

class RolFactory{
    static creeazaRol(tip) {
        switch(tip){
            case RolAdmin.tip : return new RolAdmin();
            case RolModerator.tip : return new RolModerator();
            case RolClient.tip : return new RolClient();
        }
    }
}


module.exports={
    RolFactory:RolFactory,
    RolAdmin:RolAdmin
}