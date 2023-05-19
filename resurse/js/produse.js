window.addEventListener("load",function(){


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


           /*  var optiuni = document.getElementById("inp-marca").options;
            var val_marca = [];
            for (let opt of optiuni) {
              if (opt.selected) {
                val_marca.push(opt.value);
              }
            } */

            var optiuni = document.getElementById("inp-marca").options;
            var val_marca = "";
            for (let opt of optiuni) {
                if (opt.selected) {
                 val_marca += opt.value + " ";
                }
            }   

            let val_pret=document.getElementById("inp-pret").value;
    
            var produse=document.getElementsByClassName("produs");
    
            let val_categ=document.getElementById("inp-categorie").value;

            let val_culoare=document.getElementById("i_datalist").value;

            let val_accidentata="false";
            val_accidentata=document.getElementById("i_check1").checked;

            for(let prod of produse){
                prod.style.display="none";
                let nume=prod.getElementsByClassName("val-nume")[0].innerHTML.toLocaleLowerCase();

                let pret=parseInt(prod.getElementsByClassName("val-pret")[0].innerHTML);

                let categorie=prod.getElementsByClassName("val-tipuri")[0].innerHTML;

                let combustibil=prod.getElementsByClassName("val-combustibil")[0].innerHTML;

                let marca=prod.getElementsByClassName("val-marca")[0].innerHTML;

                let culoare=prod.getElementsByClassName("val-culoare")[0].innerHTML;

                let accidentata = prod.getElementsByClassName("val-accidentata")[0].toString();

                let marciSelectate = val_marca.trim().split(" ");
   
                let cond1= (nume.startsWith(val_nume));

                let cond2= (pret>val_pret);

                let cond3= (val_categ=="toate" || val_categ==categorie);

                let cond4= (val_combustibil=="toate" || val_combustibil==combustibil);

                let includeToateMarcile = val_marca.includes("toate");

                let cond5 = includeToateMarcile || marciSelectate.some(m => marca.includes(m));

                let cond6= (val_culoare=="toate" || val_culoare==culoare);

                let cond7= (val_accidentata=="false" || (val_accidentata==accidentata));

                if(cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7)
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
            document.getElementById("inp-marca").value="toate";
            document.getElementById("i_datalist").value="toate";
            document.getElementById("i_check1").checked=false;

            var produse=document.getElementsByClassName("produs");
     
            for (let prod of produse){
                prod.style.display="block";
            }
        }
    
    
        function sortare(semn){
            var produse=document.getElementsByClassName("produs"); 
            var v_produse=Array.from(produse);
            v_produse.sort(function(a,b){
                let pret_a=parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
                let pret_b=parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
                if(pret_a==pret_b){
                    let nume_a=a.getElementsByClassName("val-nume")[0].innerHTML;
                    let nume_b=b.getElementsByClassName("val-nume")[0].innerHTML;
                    return semn*nume_a.localeCompare(nume_b);
                }
                return semn*(pret_a-pret_b);
            });
            for(let prod of v_produse){
                prod.parentElement.appendChild(prod);
                
            }
        }
    
        document.getElementById("sortCrescNume").onclick=function(){
            sortare(1);
        }
    
        document.getElementById("sortDescrescNume").onclick=function(){
            sortare(-1);
        }

        window.onkeydown= function(e){
            if(e.key =="c" && e.altKey){
                if(document.getElementById("info-suma"))
                    return;
                var produse= document.getElementsByClassName("produs");
                let suma=0;
                for(let prod of produse){
                    if(prod.style.display!="none")
                    {
                        let pret=parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
                        suma+=pret;
                    }
                }
                
                let p=document.createElement("p");
                p.innerHTML=suma;
                p.id="info-suma"
                ps=document.getElementById("p-suma");
                container = ps.parentNode;
                frate=ps.nextElementSibling
                container.insertBefore(p,frate);
                setTimeout(function(){
                    let info=document.getElementById("info-suma");
                    if(info)
                        info.remove();
                },2000)
            }
        }


}) 