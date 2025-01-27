---
title: The issue with dynamically typed languages
author: Noman Mustafa Mehar
pubDatetime: 2025-01-28T01:00:00+05:00
featured: true
draft: false
tags:
  - programming
  - languages
  - development
  - coding  
description: "A discussion on the issues with dynamically typed languages and why we should be careful when using them for large-scale projects."
---

# The Issue with Dynamically Typed Languages

There was a time when programming languages were not that accessible, only available for the selected few in the research side of computer science. Then, as business needs grew and the fields of computer science expanded, we started seeing programming languages appear left and right. Good ones stayed, and the bad ones slowly faded away. Along the way, as people got creative and better understood programming paradigms, they got better with their creations, and we started seeing a lot of variety in different programming languages—from **Fortran** to **Smalltalk**, from **ML** to **PHP**—all promising a better and brighter future.

On **February 20, 1991**, Guido van Rossum released the first version of **Python**. Its main focus was code readability and ease of use. It didn’t get that much attention during the early years, but around **2010**, it really started getting propelled into the world. Python is very novice-friendly, attracting people from all walks of life—a random mechanical engineer in India to a doctor doing his research in biochemistry in Germany. As van Rossum himself once said:

> "My philosophy is that code is read much more often than it is written."

This focus on simplicity is what led to its widespread adoption.

---

## The Novice Appeal and Its Consequences

A language where you don’t need to worry about **types**, **brackets**, or **OOP concepts** is perfect for beginners. Or in a use case where you don’t need to make a fully functional software that you need to maintain for the coming decade. But after the popularity of **Python** and **JavaScript**, people started to use these languages in all sorts of environments where it doesn’t really make sense.

**Python** or other such scripting languages are great for:

* **Scripting**
* **Automation**
* **Web scraping**
* **Automating mundane tasks**
* **One-off little concepts** you want to try

These languages are perfect for these scenarios as you don’t need to worry about potential future bugs or extensibility. You can code once, use it, and then just throw it away or keep reusing it if the requirements are the same.

But when you are trying to start something **big**, something **meaningful** that you need to present to the public, or something that has **great business value** and will be something you’ll have to rely on for years to come—a lot of other people will be touching and working with that code—then we should stop using **Python**, **Ruby**, or **JavaScript**.

---

## The Pain Points of Dynamically Typed Languages

Writing dynamically typed languages is **easy** and **convenient**. Yes, **convenient**—until you have to debug your code and now you cannot figure out why you can’t read properties of `undefined`.

No one can write perfect code, and when there are no checks to ensure what you’ve written even makes sense, then all the time savings are wasted during production when **1 out of 100 conditions** is met. I am not saying that by any means coding in **Rust** or **C#** will remove runtime errors, but by ensuring simple checks like:

* **Types**
* **Function existence**
* **Variable Scope and Shadowing**
* **Null Safety Checks**
* **Strongly Typed APIs**
* **Immutable Data Structures**
* **Static Analysis Tools**

It does really remove a lot of pain points and potential issues that might arise during production.

---

## Structure Ensures Consistency

In the book *Think Like a CTO* by Alan Williamson, there’s a very unrelated but a great saying:

> "Structures ensure consistency."

Programming languages like **Rust** and **Java** ensure we code in a certain way. It is hard to adapt to these requirements and get used to them. But over the long run, it ensures we are writing something that operates and behaves **consistently**—unlike, well, you might have seen all the **JavaScript memes**.

As **Martin Fowler**, a thought leader in software engineering, once said:

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."

Ensuring a lot of structure in terms of:

* Enforces **type safety** for fewer runtime errors.
* Restricts **attribute accessibility** to maintain **encapsulation** and **integrity**.
* Encourages adherence to good design principles, such as **SOLID** in **OOP**.

...really helps us write code that is superior to scripting language counterparts, where there is no need to ensure anything, and all the weight is on the programmer’s shoulders to make sure they are writing perfect code.

---

## Final Thoughts

**TL;DR**: For old programmers and developers, we should not just jump to the latest and greatest just because it’s trendy and fancy but really analyze what’s being sacrificed when we move to languages that seem convenient to write code in.

For newcomers, I would really recommend trying and exploring different languages, especially something like **Zig**, **Java**, or **C++**—languages that are close to **Java** or **C** (languages that are strongly typed and make you write in proper programming paradigms). And we should all really think about whether we are using the right tool for the right job because **Python** is hella good in the scenarios I explained above.

