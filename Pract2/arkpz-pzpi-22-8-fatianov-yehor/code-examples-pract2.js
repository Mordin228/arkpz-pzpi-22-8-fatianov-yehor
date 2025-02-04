// Метод 1 – Encapsulate Downcast
Object obj = getSomeObject();
if (obj instanceof SpecificType) {
    SpecificType specific = (SpecificType) obj;
    specific.performAction();
}

// Після рефакторингу  
SpecificType specific = safeCastToSpecificType(getSomeObject());
if (specific != null) {
    specific.performAction();
}

private SpecificType safeCastToSpecificType(Object obj) {
    return (obj instanceof SpecificType) ? (SpecificType) obj : null;
}

// Метод 2 – Hide Delegate
Employee employee = getEmployee();
String managerName = employee.getDepartment().getManager().getName();

// Після рефакторингу  
Employee employee = getEmployee();
String managerName = employee.getManagerName();

class Employee {
    private Department department;

    public String getManagerName() {
        return department.getManager().getName();
    }
}

// Метод 3 – Replace Record with Data
record = {"name": "John", "age": 30}
print(f"Name: {record['name']}, Age: {record['age']}")

// Після рефакторингу  
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

def print_person_info(person: Person):
    print(f"Name: {person.name}, Age: {person.age}")

person = Person(name="John", age=30)
print_person_info(person)
