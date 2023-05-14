window.onload=function(){


    document.getElementById("inp-pret").onchange=function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`
    
    }
    
        document.getElementById("filtrare").onclick=function(){
            let val_nume=document.getElementById("inp-nume").value.toLowerCase();
    
            let radiobuttons=document.getElementsByName("gr_rad");
            let val_combustibil;
            for (let r of radiobuttons){
                if(r.checked){
                    val_combustibil=r.value;
                    break;
                }
            }
            
            let val_pret=document.getElementById("inp-pret").value;
    
            var produse=document.getElementsByClassName("produs");
    
            let val_categ=document.getElementById("inp-categorie").value;
    
            for(let prod of produse){
                prod.style.display="none";
                let nume=prod.getElementsByClassName("val-nume")[0].innerHTML.toLocaleLowerCase();

                let pret=parseInt(prod.getElementsByClassName("val-pret")[0].innerHTML);

                let categorie=prod.getElementsByClassName("val-tipuri")[0].innerHTML;

                let combustibil=prod.getElementsByClassName("val-combustibil")[0].innerHTML;
    
                let cond1= (nume.startsWith(val_nume));

                let cond2= (pret>val_pret);

                let cond3= (val_categ=="toate" || val_categ==categorie);

                let cond4= (val_combustibil=="toate" || val_combustibil==combustibil);
    
                if(cond1 && cond2 && cond3 && cond4)
                {
                    prod.style.display="block";
                }
            }
        }
    
        document.getElementById("resetare").onclick= function(){
           
            document.getElementById("inp-nume").value="";
            document.getElementById("infoRange").innerHTML="(0)";
            document.getElementById("inp-categorie").value="toate";
            document.getElementById("i_rad5").checked=true;
            document.getElementById("inp-pret").value=document.getElementById("inp-pret").min;
            var produse=document.getElementsByClassName("produs");
     
            for (let prod of produse){
                prod.style.display="block";
            }
        }
    
    
        // function sortare(semn){
        //     var produse=document.getElementsByClassName("produs"); 
        //     var v_produse=Array.from(produse);
        //     v_produse.sort(function(a,b){
        //         let pret_a=parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
        //         let pret_b=parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
        //         if(pret_a==pret_b){
        //             let nume_a=a.getElementsByClassName("val-nume")[0].innerHTML;
        //             let nume_b=b.getElementsByClassName("val-nume")[0].innerHTML;
        //             return semn*nume_a.localeCompare(nume_b);
        //         }
        //         return semn*(pret_a-pret_b);
        //     });
        //     for(let prod of v_produse){
        //         prod.parentElement.appendChild(prod);
                
        //     }
        // }
    
        // document.getElementById("sortCrescNume").onclick=function(){
        //     sortare(1);
        // }
    
        // document.getElementById("sortDescrescNume").onclick=function(){
        //     sortare(-1);
        // }
}   