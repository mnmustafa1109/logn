---
title: "From Frameworks to Libraries"
author: Noman Mustafa Mehar
pubDatetime: 2025-02-16T21:00:00+05:00
featured: true
draft: false
tags:
  - programming
  - backend development
  - software engineering
  - web development
  - frameworks
description: "Explore the journey of shifting from opinionated backend frameworks to minimalist libraries, uncovering the benefits of simplicity, control, and deeper system understanding."
---

# From Frameworks to Libraries: A Backend Developer's Journey

> Controlling complexity is the essence of computer programming. - Brian Kernighan

## The Beginning
The first time I worked as a backend developer was in 2019, using the Ruby on Rails framework for a new startup my friends started. Since then, I have worked with Django, spring-boot, express, justify, and ASP.NET Core. Recently, for the last two major projects I worked on, I decided to take a break from these opinionated frameworks and instead use simple libraries like Echo and Ktor in Go and Kotlin, respectively.

## A Word of Caution
> The most dangerous phrase in the language is, 'We've always done it this way.' - Grace Hopper

I wrote this article to tell you about my experience shifting from mostly batteries-included opinionated frameworks to starting a backend project from scratch.

I would like to first inform you that starting a backend from simple HTTP libraries is not for everyone. I have a background in Software Engineering and understand all the Software Architectures, Programming Paradigms Design Patterns etc. If you are someone new to programming or do not have much experience in Software Concepts I would highly suggest not going through this route as it would be the equivalent of shooting a bullet on your feet.

## The Framework Advantage
Web Frameworks have many advantages. They help you get started quickly, especially with frameworks like Ruby on Rails, whose core target audience is startups, to help them deliver a quick MVP. Those frameworks are also designed to have a lot of features that cater to a wide range of users. These usually result in very bloated software, just look at Springboot taking minutes to boot due to the initialization of so many different services.

## The Hidden Complexity
> Simplicity does not precede complexity, but follows it. - Alan Perlis

Frameworks also most of the time abstract a lot of different processes to make it easier for the user. This helps with starting quickly and not caring about the hidden complexity. But down the line, you start getting weird issues and bugginess which are usually very simple to solve but due to the underlying abstraction, they become harder to identify and fix. And as you never interact with the framework code itself sometimes you will also face issues for which the fix is not even possible. Or for which to fix you need to read and understand everything from scratch, then figure out a fix around it.

## The Beauty of Simplicity
> The purpose of abstraction is not to be vague, but to create a new semantic level in which one can be absolutely precise. - Edsger Dijkstra

In my opinion, the HTTP protocol itself is pretty simple and elegant in itself. Starting a backend from scratch only takes a few days of work. Just grab a nice easy-to-use HTTP library, and combine it with an ORM, a JSON parser, and an auth library and you have a fully working backend to start. Whenever the scope expands and requirements change just add another library one at a time. This way you'll always have only what you need nothing extra.

## Understanding the Stack
> Programs must be written for people to read, and only incidentally for machines to execute. - Harold Abelson

When you make something from scratch you will know all the involved complexity from the initial HTTP route request to running queries on the database. You can easily figure out where the problem is if any occurs and find a fix as you would already have a good understanding of the system.

## Growth and Learning
This approach also encourages learning and developing a good understanding along the way. It forces you to get out of your comfort zone and motivates you to research the respective processes involved in backend pipelines for better implementation.

### Key Benefits of Building from Scratch:
* **Complete Control**: Understanding and managing every component of your system
* **Minimal Bloat**: Including only what you need, when you need it
* **Better Debugging**: Clear visibility into the entire request-response cycle
* **Continuous Learning**: A deeper understanding of web technologies and protocols
* **Performance Optimization**: Ability to fine-tune each component for your specific needs

## TL;DR
Having worked for several years with frameworks like Rails, Django, and Spring Boot, I currently rely on barebones libraries only such as Echo (Go) and Ktor (Kotlin) for backend work. Frameworks have amazing capabilities and fast revs, but they have underlying problems and debug issues. Building entirely through the assistance of root libraries is more controllable, understandable, and efficient but it requires the user to be proficient in good software engineering techniques. Although adopting this style may prove challenging to novice programmers, it suits well-experienced developers who crave higher system information and more controlled behaviour of their stack.