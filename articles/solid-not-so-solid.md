---
title: "SOLID not so SOLID"
description: "A fun and honest take on SOLID principles, starting with Dependency Inversion and why it matters (or not)."
category: "technical"
date: "02-03-25"
read: "6 min read"
---

# SOLID not so SOLID

In this **dump pile of trash**, where your browser has somehow rendered this file, I’ll talk about the SOLID principle and how these so-called “best practices” have **messed up the developer community.** 

We’ll start with **D**, cause **why not?**

### D - No, Not That D, You Filthy Mind! (Dependency Inversion)

*“High-level modules should not depend on the low-level modules. Both should depend on the abstraction.”*

- Some Genuis Who Made This Rule.

Didn’t get it? yeah me neither at first, so let’s dump this down.

Without this so-called Dependency Inversion, how will things look? Imagine we got an OrderService and the service needs to notify the users of some event. 

```csharp
public class OrderService()
{
	private readonly SMSNotificationService SMSNotificationService;
	
	public OrderService()
	{
		_SMSNotificationService = new SMSNotificationService();
	}

	public async Task ProcessOrder(int id)
  {
	  Console.WriteLine($"Order {id} processed!");
	  _smsNotification.Notify($"Your order {id} is confirmed.");
  }
}
```

**What’s wrong here?** 

- Tightly coupled - this order service knows too much about the SMSNotificationService.
- Open/Close Principle (Oh yeah, we’ll roast this one later) - when you edit this SMSNotificationService or switch to any other service, the order service also needs to be modified.
- Not testable - no way to swap notification service with any other.

### How Dependency Inversion Saves Our Sanity

Here’s how we decouple things with the interface.

```csharp
/* declear a contract
 This is like saying:
 "I don’t care how you notify. Just make sure you do it!" */

interface INotificationService
{
	Task<Response> Notify(string message);
}

# message notication implements it's own notify method 
public class SMSNotification: INotificationService
{
	public async Task<Response> Notify(string message)
	{
		Console.WriteLine($"SMS sent: {message}");
	}
}

# email notification implements it's own notify method
public class EmailNotification: INotificationService
{
	public async Task<Response> Notify(string message)
	{
		Console.WriteLine($"Email sent: {message}");
	}
}
```

Now with this *INotificationService* interface we can use any of the implemented class through Dependency Injection. Order service **doesn't know or care which one is used**.

```csharp
class OrderService: INotificationService
{
	
	private readonly INotificationService _notificationService;
	
	public OrderService(INotificationService notificationService)
	{
		_notificationService = notificationService;
	}
	
	public async Task<Response> ProcessOrder(int Id)
	{
		Console.WriteLine($"Order processed {Id}");
		_notificationService.Notify(message);
	}
}
```

```csharp
builder.Services.AddScoped<INotificationService,SMSNotification>();
builder.Services.AddScoped<OrderService>();
```

Here the *SMSNotification* class is currently being used, **we can easily change** this to *EmailNotification* if we want, without breaking anything in our code.

In this context, our high-level class is OrderService, which interacts with the SMSNotification class without directly depending on it.

### What’s Next?

That was just D, wait till we talk about **I (Interface Segregation)** and how it gave birth to an army of useless micro-interfaces!