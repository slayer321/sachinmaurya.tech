+++
title = "Golang defer cost me 100 bucks"
description = "Golang defer cost me 100 bucks"
date = 2024-09-01
type = ["posts","post"]
tags = [
    "Go",
    "Golang",
    "defer"
]
[ author ]
  name = "Sachin Maurya"
+++

[![2.png](https://i.postimg.cc/G2HNvpP3/2.png)](https://postimg.cc/bDf3hpF4)


Hi, It’s been a while since my last blog post, and during this time, I’ve contemplated sharing many insights and experiences. However, procrastination got the better of me, and those topics remained on the back burner. But today, I’m excited to dive into some technical insights I’ve learned the hard way

So I have been working with Go for quite a while now.  And recently I learned something interesting about Go that I wanted to share.


## Defer in Go

If you know about Go you already know what defer is in Go. Let’s get some basics clear, defer is something in Go that executes at the end of the function. 
Below is the simple Hello World program.

```Go
// Playground link : https://go.dev/play/p/PLLlz_4evLp 

package main

import "fmt"

func helloWorld() {
	fmt.Println("Hello world")
}

func main() {

	fmt.Println("Inside the main")
	defer helloWorld()

	fmt.Println("main exit")
}
```
Output of the program is 
```txt
Inside the main
main exit 
Hello world 
```

Some of the common use cases of the defer it is used for Closing. It can be a file close or an HTTP call close.
```GO
f , err := os.Open("test.txt")
if err != nil{
	 log.Fatalf("Not able to open the file %v\n",err)
}
defer f.Close()
..... 
....
```

Using multiple defer in a single function

```Go
// Playground link : https://go.dev/play/p/NeD_6xN2WgT
package main

import "fmt"

func main() {
	defer fmt.Println(1)
	defer fmt.Println(2)
	defer fmt.Println(3)
	fmt.Println("The count is")
}
```

This Prints  “The count is 3,2,1”. We will go into an explanation in some time. These are some of the ways we can use defer. 



:money_with_wings: Now comes a question that cost me 100 bucks. :money_with_wings:

```Go
// Playground link : https://go.dev/play/p/-ZWpgjraTxc

package main

import "fmt"

func helloWorld() func() {
	fmt.Println("Inside the hello World")

	return func() {
		fmt.Println("Exit from Hello World")
	}
}

func main() {

	fmt.Println("Inside main")
	defer helloWorld()()
	fmt.Println("Exit")
}
```

Before seeing the answer can you guess what the output will be?

If you are naive like me you will say the below output.
```txt
Inside main
Exit
Inside the hello World
Exit from Hello World
```

But the correct output is
```txt
Inside main
Inside the hello World
Exit
Exit from Hello World
```

## Now let’s dig deeper into how defer works internally.


The above example that we saw was we were printing three ints using defer. Internally when the defer is registered it gets stored in the stack. Once the function returns the defer calls get executed in a LIFO(Last In First Out) manner just like stack. 

[![defer-stack.png](https://i.postimg.cc/DyTh3qdq/defer-stack.png)](https://postimg.cc/LhNwzgWX)

Now that you have a basic understanding of how defer works. Let’s dig deeper into the code which cost me 100 bucks. Inside the main we are deferring the helloworld function if you read the helloworld function carefully we can see the return types of the helloworld is function itself and when we are calling the helloworld function using defer we have two parenthesis where we are saying to call the return function as well. When the defer statement is evaluated it stores the return function of helloworld to stack and executes the helloworld function which causes the **Inside the hello World** to print then finally before the main function exits the defer statement is executed which prints the **Exit from Hello World** . 

## Do the defer statements execute after the return or before the return of the function?

I had this query and after going through lots of blog posts I was just getting more and more confused. Some of them mentioned that defer is executed just before the return statement of the function and some mentioned after the return function

Let’s refer to one of the examples from [Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover) blog post at the start of the post there is a statement that got me confused.

> A defer statement pushes a function call onto a list. The list of saved calls is executed after the surrounding function returns.

Here it mentions that the **list of saved calls is executed after the surrounding function returns** . In the third example of the blog post we see a function c() which is returning 1 for variable i and if we print it will give 2 which is expected as the defer function is executed after the return of the function c() and inside the defer execution we are incrementing the value of variable i. 

```Go
func c() (i int) {
    defer func() { i++ }()
    return 1
}

func main(){
   fmt.Println(c())
}
```

Now let’s consider the below example

```Go
// Playground link : https://go.dev/play/p/999swx0tgNi\

package main

import "fmt"

func Tell(txt string) {
	fmt.Println(txt)
}

func hello() string {
	defer Tell("inside method")
	return "inside"
}

func main() {
	fmt.Println(hello())
	Tell("outside")
}
```

Here I was expecting the output to be 

```txt
inside 
inside method
outside
```

I was thinking of the hello return’s **inside** so it should be printed first and then the defer function print should have happened. But this is not what we get when we run the program.
I stumbled upon this defer statement spec (https://go.dev/ref/spec#Defer_statements) and after reading it twice it started making sense. If you read this line carefully 

>That is, if the surrounding function returns through an explicit return statement, deferred functions are executed after any result parameters are set by that return statement but before the function returns to its caller.


It mentions that defer functions are executed after any result parameters are set by that return statement but before the function returns to its caller. The last 8 words where it all started making sense to me.

So we can conclude that defer functions are executed after the return statement of the executing function but before the returns to its caller that was the reason in the above example the first print was **inside method** and not **inside** because here before return to the caller it also executed the defer statement which printed the  **inside method**.

## Conclusion

You must be still thinking was this some production bug that cost me 100 bucks? No, it wasn’t we had a small quiz kind of thing organised by one of the leads at my workspace where we have this exercise about Golang defer whoever loses has to pay 100 bucks and if you win you get 100 bucks. You can guess from the title I lost. But it sparks the curiosity in me to learn how exactly defer works internally and learn about all the gotchas.

I learned a lot’s of things about defer during this whole process.I hope you found this blog helpfull. If you have any queries or concerns do reach out to me on my socials.

## Reference 

https://go.dev/blog/defer-panic-and-recover 

https://blog.learngoprogramming.com/gotchas-of-defer-in-go-1-8d070894cb01 (I highly recommend reading 3 part series on defer Gotchas by Inanc Gumus)