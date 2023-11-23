---
title: "Dapper split on argument"
description: "Effortless Object Nesting with Dapper's splitOn argument."
category: "technical"
date: "11-10-23"
read: "3 min read"
---

# Effortless Object Nesting with Dapper's `splitOn` Property 

In C# application development, retrieving data from relational databases and mapping it to object hierarchies is a common task. Dapper, a popular micro-ORM (Object-Relational Mapping) library, streamlines this process and provides a powerful feature known as the `splitOn` property. In this blog post, we'll explore how to use Dapper's `splitOn` property to efficiently map nested objects while querying data from a SQL database.

## The Scenario

Let's set the stage: you're working with a SQL database that comprises two tables, Users and Locations. Each user can have multiple associated locations. Your goal is to fetch data from both tables and map it to C# model classes in a way that allows users to have a list of associated locations.

## The Code Breakdown

Here's a step-by-step breakdown of the code that achieves this, with a specific focus on how Dapper's `splitOn` property is utilized for object nesting:

```csharp
string query = @"SELECT u.Id, u.Name, l.Id, l.City, l.State
    FROM Users u
    LEFT JOIN Locations l ON u.Id = l.UserId";

using (SqlConnection conn = new SqlConnection(connectionString))
{
    conn.Open();

    var userDictionary = new Dictionary<Guid, User>();

    var userList = conn.Query<User, Location, User>(
        query,
        (user, location) =>
        {
            if (!userDictionary.TryGetValue(user.Id, out User userData))
            {
                userData = user;
                userData.Locations = new List<Location>();
                userDictionary.Add(userData.Id, userData);
            }

            if (location != null)
            {
                userData.Locations.Add(location);
            }

            return userData;
        },
        splitOn: "Id")
        .Distinct()
        .ToList();

    return userList;
}
```
## Understanding the Code

### SQL Query
We initiate our journey with a well-crafted SQL query. It performs a LEFT JOIN between the Users and Locations tables, seamlessly retrieving user information (columns from the Users table) and location information (columns from the Locations table) within a single result set.

### Dapper Query
Dapper's `conn.Query` method is where the magic happens. We specify the expected output types as `User` and `Location`. Notably, we are mapping the result set to nested objects.

### Mapping Function
Our mapping function is a crucial piece of the puzzle. Here, we manage object nesting. A dictionary (`userDictionary`) is employed to keep track of unique users. If a user isn't found in the dictionary, we create a new user object and add it. We then check if the location isn't null and correctly associate it with the corresponding user.

### The `splitOn` Property
The star of the show is Dapper's `splitOn` property. We set it to "Id,Id". This setting instructs Dapper to split the result set into two objects whenever it encounters a column named "Id." This split action ensures that user and location objects are accurately nested.

### Result Manipulation
After executing the query, we apply `.Distinct()` to ensure unique results and `.ToList()` to materialize the data into a list.

## Conclusion
Dapper's `splitOn` property is a powerful feature for mapping nested objects while working with relational databases. It significantly simplifies the process of querying and mapping data into complex object hierarchies. By understanding and harnessing this feature, developers can efficiently fetch and nest data from multiple tables, making C# applications more expressive, maintainable, and efficient.
