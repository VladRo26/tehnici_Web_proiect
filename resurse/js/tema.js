document.addEventListener("DOMContentLoaded", function() {

    // Verifica daca tema intunecata este setata in localStorage.
    let tema = localStorage.getItem("tema");
    
    // Daca tema exista in localStorage (adica a fost setata anterior), executa urmatoarele instructiuni
    if (tema) {
      
       // Adauga clasa 'dark' la elementul body al documentului pentru a activa tema intunecata
      document.body.classList.add("dark");
      document.body.classList.add("extra");

      
      // Daca tema intunecata este activata, ascunde iconul cu soare si afiseaza iconul cu luna
      document.getElementById("sun-icon").classList.add("d-none");
      document.getElementById("moon-icon").classList.remove("d-none");
      
       // Seteaza comutatorul de tema in pozitia ON
      document.getElementById("tema").checked = true;
    }

    // Adauga un listener pentru evenimentul 'change' pe comutatorul de tema
    document.getElementById("tema").onchange = function() {
      
      let sunIcon = document.getElementById("sun-icon");
      let moonIcon = document.getElementById("moon-icon");
  
      // Verifică dacă clasa 'dark' este prezentă pe elementul body
      if (document.body.classList.contains("dark")) {
        
        // Se trece la tema luminoasa
        document.body.classList.remove("dark");
        localStorage.removeItem("tema"); 
  
        // Schimba iconurile
        sunIcon.classList.remove("d-none");
        moonIcon.classList.add("d-none");
      } else {
        
        // Dacă clasa dark nu este prezenta, atunci tema luminoasă este activa, deci trebuie să comutăm la tema intunecata
        document.body.classList.add("dark");
        localStorage.setItem("tema", "dark"); 
  
        // Ascunde iconul cu soare și afiseaza iconul cu lună
        sunIcon.classList.add("d-none");
        moonIcon.classList.remove("d-none");
      }
    }
});


