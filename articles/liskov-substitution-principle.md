---
title: "Liskov's Substitution Principle"
description: "How a Penguin can break your code"
category: "technical"
date: "28-06-25"
read: "4 min read"
---

> “Subtypes must be substitutable for their base types without altering the correctness of the program.”
> 

Sounds profound, right? That’s Liskov for you.

### 🧠 But what does it *really* mean?

In simple terms: if you inherit from a class, your subclass should be able to **replace the base class** *anywhere* in the code without breaking functionality.

Let’s look at a silly example:

```csharp
public abstract class Bird {
    public abstract void Fly();
}

public class Penguin : Bird {
    public override void Fly() {
        Console.WriteLine("Penguin can't fly");
    }
}
```

Looks harmless? It’s actually violating **LSP**.

By inheriting from `Bird`, we're implying all birds can fly. But penguins? Not so much. So, if somewhere in your code you have:

```csharp
Bird bird = new Penguin();
bird.Fly(); // Boom! Logic fail.
```

That’s an LSP violation—because `Penguin` cannot truly act as a `Bird` if `Bird` assumes flight capability.

---

### A Better Way

We should **design by behavior**, not identity.

```csharp
public interface IFly {
    void Fly();
}

public abstract class Bird {
    // shared bird logic
}

public class Sparrow : Bird, IFly {
    public void Fly() {
        Console.WriteLine("Sparrow is flying");
    }
}

public class Penguin : Bird {
    // No Fly() here, as expected
}

```

Now, only birds that *can* fly implement the `IFly` interface. No broken expectations. No surprise crashes.

---

### 💡 And here’s the cool part:

This redesign doesn't just satisfy **Liskov Substitution**. It also touches on other **SOLID** principles:

- **Interface Segregation** — Only birds that can fly implement `IFly`.
- **Open/Closed** — You can add new birds or behaviors without modifying existing code.
- **Dependency Inversion** — Clients depend on abstractions like `IFly`, not concrete bird types.

So yeah — fix one thing, and the rest kinda fall into place. That's the beauty of SOLID.