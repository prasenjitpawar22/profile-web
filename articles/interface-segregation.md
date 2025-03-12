---
title: "Interface Segregation: Don't Force Your Minions to Do Useless Work"
description: "ISP keeps code clean by ensuring classes only implement what they need."
category: "technical"
date: "12-03-25"
read: "4 min read"
---

# Interface Segregation: Don't Force Your Minions to Do Useless Work

Imagine having an **army of minions** at your disposal. You can spin up as many as you want—no limits! The more minions you have, the crazier the dev you are. But here's the catch: you wouldn't make all of them do **every single task**, right? Some minions are great at **cooking**, some at **serving**, and some at **handling cash**. You wouldn’t force your **chef minion** to process payments, would you?

That’s exactly what the **Interface Segregation Principle (ISP)** is all about.

It states:

> "Clients should not be forced to depend on interfaces they do not use."
> 

In simpler words: *A class shouldn’t be forced to implement things it doesn’t need. Period.*

Imagine we have a **`IRestaurantEmployee`** interface that includes methods for both **chefs, waiters, and cashiers**:

```csharp
// ❌ This interface forces unnecessary methods on employees
public interface IRestaurantEmployee
{
    void CookFood();
    void ServeFood();
    void TakeOrders();
    void ProcessPayment();
}

// 👨‍🍳 Chef should only cook food, but is forced to implement other methods
public class Chef : IRestaurantEmployee
{
    public void CookFood() => Console.WriteLine("👨‍🍳 Cooking food...");

    public void ServeFood() => throw new NotImplementedException("❌ Chef doesn't serve food!");

    public void TakeOrders() => throw new NotImplementedException("❌ Chef doesn't take orders!");

    public void ProcessPayment() => throw new NotImplementedException("❌ Chef doesn't process payments!");
}

```

### **Issues in this Design:**

- **The `Chef` class is forced to implement unrelated methods** (`ServeFood`, `TakeOrders`, `ProcessPayment`).
- **Throwing `NotImplementedException` is a code smell** – it indicates the interface is too broad.
- **Any change in the interface affects all implementing classes,** making maintenance difficult.

---

## **Applying ISP Correctly**

Now, let’s **break down the interface** into smaller, more specific interfaces:

```csharp
// 🔹 Only relevant methods for each role
public interface ICook
{
    void CookFood();
}

public interface IWaiter
{
    void ServeFood();
    void TakeOrders();
}

public interface ICashier
{
    void ProcessPayment();
}

// 👨‍🍳 Chef now implements only what is needed
public class Chef : ICook
{
    public void CookFood() => Console.WriteLine("👨‍🍳 Cooking food...");
}

// 🏃‍♂️ Waiter only serves food and takes orders
public class Waiter : IWaiter
{
    public void ServeFood() => Console.WriteLine("🍽 Serving food...");
    public void TakeOrders() => Console.WriteLine("📝 Taking orders...");
}

// 💰 Cashier only handles payments
public class Cashier : ICashier
{
    public void ProcessPayment() => Console.WriteLine("💵 Processing payment...");
}

```

---

## **Why is This a Better Design?**

- **Each class only implements what it actually needs.**
- **No unnecessary dependencies (no more `NotImplementedException`).**
- **Easier to extend and modify** – If we need a `Bartender` role later, we just add another interface (`IMakeDrinks`).

---

## **Key Takeaways**

- **Large, bloated interfaces are bad** – break them down into **smaller, focused** interfaces.
- **Each class should only implement what it actually needs**, improving maintainability.
- **ISP makes the code flexible, scalable, and easy to modify** without unintended side effects.