// class Car {
//   constructor(name, color) {
//     this.name = "Toyota camry";
//   }
// }

// const newCar = new Car();
// console.log(newCar.name);

class CellPhone {
  constructor(name, model) {
    this.name = name;
    this.model = model;
  }
  phoneSpec(Ram, Rom) {
    return `${this.name} ${this.model} has ${Ram} of Ram and ${Rom} of Rom`;
  }
}

const newCellPhone = new CellPhone();
newCellPhone.name = "Samsung";
newCellPhone.model = "s12";
console.log(newCellPhone);
//console.log(newCellPhone.model);
console.log(newCellPhone.phoneSpec("12gb", "256gb"));

class JambStaff {
  constructor(idCard, department, division, name) {
    this.name = "Fatai";
    this.department = "ITS";
    this.division = "General services";
    this.idCard = "5504u";
  }
  promotion(score) {
    if (score >= 50)
      return `Mr ${this.name} of ${this.department} in ${this.division} with id ${this.idCard} you are promoted`;
    return `Mr ${this.name} of ${this.department} in ${this.division} with id ${this.idCard} you are not promoted`;
  }
}

const newStaff = new JambStaff();

console.log(newStaff.promotion(55));
