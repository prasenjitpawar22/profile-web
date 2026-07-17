---
title: "Closures: JavaScript's Memory Trap"
description: "A fun and honest look at JavaScript closures, why interviewers love them, and how they quietly eat your RAM."
category: "technical"
date: "06-14-26"
read: "5 min read"
---

# Closures: JavaScript's Memory Trap

Welcome back to the second installment of me yelling at tech concepts. Last time, we looked at how Dependency Inversion stops you from breaking your code. Today, we are diving into **JavaScript Closures**—the single most weaponized concept in technical interviews.

Interviewers love asking about this just to see if you panic. Let’s strip away the academic garbage and see what it actually is.

### What is a Closure? (The Boring Definition)

If you look up MDN, it says some robotic stuff like: 
*“A closure is the combination of a function bundled together with references to its surrounding state.”*

Blah, blah, blah. 

Let's dump this down to human terms: **A closure just means a function has a photographic memory.** Even after its parent function is dead and gone, the inner function still remembers the variables it grew up with.

### The "Fake" Closures You See Online

If you search for closure examples, clueless tutorials will show you code like this:

```javascript
const globalData = "I am inevitable";

setTimeout(() => {
    console.log(globalData);
}, 100);
```

**Is this a closure?** Technically, yes, because *all* JavaScript functions retain access to their outer scopes. But practically? **No.** 

`globalData` is in the global scope. It lives forever anyway. Using this example to explain closures is like bragged about your memory because you remember your own name. It’s cheating.

### The Real Deal: Outliving the Parent

A true, pure, interview-grade closure happens when an **inner function outlives its parent function**. 

Look at this C#-looking Javascript counter code:

```javascript
function createBankVault() {
    let cash = 1000; // Totally hidden from the outside world

    return {
        checkBalance: function() {
            console.log(`You have $${cash} left.`);
        },
        withdraw: function(amount) {
            cash -= amount;
            console.log(`Withdrew $${amount}.`);
        }
    };
}

// 1. Run the function and save the returned object
const myAccount = createBankVault();

// 2. At this exact moment, createBankVault() has FINISHED executing. 
// Its execution context is dead. Popped off the stack. Deleted.
```

Under normal garbage collection rules, that `cash` variable should be wiped from your RAM. It’s gone. Dead.

**But watch this magic trick:**

```javascript
myAccount.checkBalance(); // Logs: You have \$1000 left.
myAccount.withdraw(200);  // Logs: Withdrew \$200.
myAccount.checkBalance(); // Logs: You have \$800 left.
```

**How?** Because the inner functions (`checkBalance` and `withdraw`) created a **closure** around the `cash` variable. They dragged it into a secret backpack in memory. JavaScript cannot delete `cash` because these functions still hold a reference to it.

### Why This Messes Up Your Apps (The Dark Side)

Senior devs love closures because they let you create **private variables** (like our `cash` variable that nobody can modify directly). 

But here is what the textbook gurus won't tell you: **Closures are a massive source of memory leaks.**

Because JavaScript is forced to keep those inner variables alive in their "secret backpacks", that memory can **never** be reclaimed by the browser as long as your inner function exists. If you casually spawn thousands of closures inside a heavy app and forget to clean them up, congratulations: your user's browser tab just crashed.

### What’s Next?

Next time, we’ll go back to the SOLID train and roast **I (Interface Segregation)**—or as I like to call it, *"The birth of an army of useless micro-interfaces that do absolutely nothing!"*
