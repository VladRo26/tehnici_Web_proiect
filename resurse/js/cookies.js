

//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare){//timpExpirare in milisecunde
    d=new Date();
    d.setTime(d.getTime()+timpExpirare)
    document.cookie=`${nume}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(nume){
    vectorParametri=document.cookie.split(";") // ["a=10","b=ceva"]
    //cand afisez un cookie se vede doar cheia si valoarea ce sunt separate prin =, facem split sa despartim cookiurile intre ele 
    for(let param of vectorParametri){
        if (param.trim().startsWith(nume+"="))
        //verific daca a=10 , b=20, si luam valoarea adica 10
            return param.split("=")[1]
    }
    return null;
}

function deleteCookie(nume){
    console.log(`${nume}; expires=${(new Date()).toUTCString()}`)
    document.cookie=`${nume}=0; expires=${(new Date()).toUTCString()}`;
    //setam un cookie cu numele respectiv si ii pune ca data de expirare, data curenta
}

function deleteAllCokies(){
    vectorParametri=document.cookie.split(";")
    for(let param of vectorParametri){
        if (param.trim().startsWith(nume+"="))
            param.split("=")[1].deleteCookie
    }
}


window.addEventListener("load", function() {

    var banner = document.getElementById("banner");

    if (getCookie("acceptat_banner")) {
        banner.style.display = "none";
    //Se ascunde banner dacă cookie-ul există
    } else {
        banner.style.display = "block";
    // Afișează elementul banner dacă cookie-ul nu există
    }

    document.getElementById("ok_cookies").onclick = function() {
        //cookieul se numeste acceptat_banner
        setCookie("acceptat_banner", true, 6000); 
        banner.style.display = "none";
    

    // Crearea unui cookie cu data si ora ultimei accesari a site-ului
    setCookie("ultima_accesare", new Date().toISOString(), 6000); // Cookie-ul va expira dupa 24 de ore
    // Creează un cookie numit "ultima_accesare" cu valoarea fiind data și ora curente în format ISO și timp de expirare de 6000 secunde


    document.getElementById("ultima_accesare").textContent += getCookie("ultima_accesare");
    // Adaugă valoarea cookie-ului "ultima_accesare" în conținutul elementului cu id-ul "ultima_accesare"
    //cookiurile au un timp de expirare, local storage nu, si ele nu se suprascriu se separa cu ;
    }
    
});
