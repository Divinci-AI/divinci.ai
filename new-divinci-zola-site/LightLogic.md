LightLogic.md

Researchers have developed a new photonic chip  that uses light for computing I've talked about  
many photonic chips on this channel but this  optical chip is something different today I will  
explain how it actually works and how did they  manage to achieve this 1000 x performance? Let  
me shine some light on it! when I think about  light the first thing that comes to my mind is  
a warm... warm yellow sunlight and what is colour  colour is a wavelength of an electromagnetic wave  
now some of these waves we can see but most of  them we can't but the essence of light is photons  
this little packets of energy the main difference  between photonic and electronic computer chips is  
that in photonic we use light instead of electrons  for computation and as we will understand later on  
Computing with Light
in the video the main difference is that in  photonic we can compute the data on the fly  
we don't have to stop the data like we do it in  Classical Computing we actually process the data  
while it's traveling and this computation on the  fly is in the range of femto seconds which is one  
quadrillionth of a second so it's very fast  and also at almost no latency you know when  
we switched from vacuum tubs to transistors we  went from microseconds to now nanoseconds but  
photonic computer allows us to reduce it to  femtoseconds let's understand how researchers  
came up with this idea and for that let's go back  in time the first revolution in photonic computing  
was the development of the laser the laser is a  device that turns random unfocused photons into  
a powerful focused beam it was invented over 60  years ago and Charles Towns who is considered to  
be a father of photonic got a Noble Prize for it  but back then there were no real application for  
the laser while nowadays we use it pretty much  every day several times starting from printers  
and scanners to quantum computers and extreme  ultraviolet lithography machines that are used  
to fabricate every single silicon chip today  you know modern chips like AMD CPUs or Nvidia  
GPUs would simply not be possible without these  machines and without the laser just think about  
the laser quest.. this is surely worth a Nobel  Prize don't you think after the laser the second  
huge milestone in photonics was the development  of optical fiber for communication it was first  
developed by Charles Kuen Kao, who was also  later awarded the Nobel Prize in physics for  
his contributions he engineered a special quartz  glass material and it was transparent enough so  
that photons couldn't be sent over huge distance  distances hundreds and hundreds of kilometres and  
information travels at the speed of light through  the optical fiber and there is nothing faster than  
that in the world and then they took it to the  next level and they managed to send multiple  
signals at the same time through this same fiber  and this was possible due to this beautiful  
property of light that it has different colours or  different wavelength of light that don't interfere  
with each other so we can s a great amount of  information simultaneously and this of course also  
applies to Computing so the next huge milestone in  photonics was the development of silicon photonics  
because at this point we've already achieved and  learned a lot with silicon we've learned how to  
manufacture silicon chips on a massive scale and  then there was this idea to take all we know about  
semiconductor design and Manufacturing  and integrate silicon with photonics and  
use photons not just for data transmission but  for the Computing itself because in this way we  
can take advantage of this massive parallelism and  the speed of light that's a brilliant idea right  
and of course apart of this a very promising field  of photonics quantum Computing had begun evolving  
which enables the dream of Quantum Computing  Quantum Computing at room temperatures let me know  
in the comments if you want me to make a separate  episode about it and make make sure to subscribe  
to the channel not to miss it now how does this  Tai Chi chip work it's a photonic chiplet so  
Taichi Chip
it consists of several chips with different  functionalities combined in a single package  
if we consider all the photonics chips there  are two main approaches to building them it's  
usually uses either light diffraction or light  interference for computing however this chip takes  
it one step further and combines both of these  approaches in a very interesting way let's start  
with light interference of course after the great  success of me talking about light interference in  
the previous video I probably should continue  to ride this wave jokes aside I hope you have  
forgiven me anyway many people inferred what I was  referring to as you know light is a wave and waves  
can interact into interfere or overlap if we go  to the basic level if I have two sinusoids that  
are in the same phase the resting wave will  be twice the amplitude and we will be able to  
better notice it because it will be just brighter  however when I take two sinusoids that have been  
phase shifted 180° we have a phenomenon called  destructive interference and in this case these  
two waves cancel each other out and this leads  to a drop in light intensity or it can even lead  
to a total darkness many photonic chips nowadays  implement this principle of light interference to  
Photonic Logic Gates
implement linear operations so how does it work  or simply put how we can Implement simple logic  
operations with light logic operations on a chip  usually implemented with logic gates which are  
these tiny switches in electronics these are  built of transistors and a typical electronic  
circuit consists of billions of switches that  iterate between on and off states and each of  
these gate has a logical operation behind them if  we take an end logic gate for example depending  
on the combination of the input values we get an  output as a result for example when both inputs  
are ones so one and one we get one at the output  when the inputs are one and zero, 0 and 1, one  
and zero the output is zero in electronics all  the zeros and ones are represented by voltages by  
voltage level so if the voltage is above certain  value a certain threshold it's one below at zero  
and in photonics it works in a similar way but  instead of voltages we have light intensity so  
we measure this light intensity at the output  and if it's above a certain value then it's one  
otherwise it's zero this thing here is a logic  end gate it has two inputs and one output the  
first thing that we do is here we use interference  uh in this optical combiner and we make sure that  
we have a strong field only when both of the  input are on and then the next stage that we  
have here is this micro-ring and this micro-ring  allows us to make a strong distinction between the  
on and the off level so that the next Gates which  listen to this Gates can understand the signal and  
before we discuss how we can use diffraction for  computing this light I guess you can imagine how  
much research goes into a video like this one it  usually takes me tens of hours over multiple days  
and of course I do a lot of fact checking and  reading beforehand for this I like using Opera  
browser because it has some very cool build-in  AI features first of all there is their AI Aria  
with this you can actually get answers to your  questions directly in your Opera sidebar I really  
like this feature because it speeds up my research  process a lot whenever I read something online and  
I encounter a term or concept that is not familiar  to me I can highlight it and Aria will give me a  
quick explanation which I find very handy and then  after a few hours I have so many tabs open and at  
some point I'm just lost but Opera browser has tab  islands to deal with it I use it to rearrange tabs  
into separate Islands on related topic for example  all the tabs related to photonic computing are  
grouped in the first island then all the research  papers I'm using are grouped in this second island  
and all the resources related to the diffraction  of light are in this third I highly recommend you  
to give it a try you can download Opera for free  using the link below check it out back to photons  
Computing with Diffraction
there is a second very interesting way a very  interesting approach to Computing this light  
using light diffraction let's say we have a light  wave that moves through an opening and as a light  
passes through it gets diffracted it we can see it  as the bending of light when it moves through this  
opening it's easier to imagine if you consider  what waves being diffracted photonic diffraction  
is basically light waves bending around the  obstacles and guess what it can be also used  
for performing logical operations let's say we  code input information into the amplitude of the  
light and then it goes from the input layer  through the diffraction layer to the output  
each region of this diffraction layer is a special  metasurface which is assigned with the particular  
logic operation for example here we have an or  logic gate where we have one and zero at the input  
which gives us one as the output it's complicated  yes but it works works but the main drawback  
of this approach are that these operations are  hardcoded hardcoded into this surface and it can't  
be reconfigured why this work is so interesting  because they decided to take the best of both  
How Taichi Chip Works
methods light interference and light diffraction  and combine it in a single Tai Chi chip first we  
need to encode input data into light and usually  this coding step is a weak spot in photonic  
Computing because this conversion from digital  to analog so from digital to light is error  
prone and it's very hard to make it as accurate  as Digital Signal processing but in this case  
they used light diffraction on a chip to encode  information into Optical patterns and because it's  
a fixed algorithm they can implement it through  diffraction by using diffraction surfaces so what  
happens is that just the light passing through the  diffraction layers and it's been encoded on the  
fly at almost no energy and in a massive parallel  way so this is as good as it gets then for the  
Computing Parts they use light interference you  know when we talk about any AI related computation  
we mostly mean the operation with matrices  there is also another nonlinear part which is  
the activation function and you can't ignore it as  well but the most of the operations are operations  
with matrices in neural networks everything is  represented by matrices for example if we want  
to do image recognition to know what's on it we  need to multiply matrices together and sum up the  
result for this chip to implement this multiply  accumulate operation with photonics the first  
encode the input information into the amplitude  of light and then this light is passes through  
so called Mach-Zehnder interferometer and as you  may guess from the name this device operates based  
on the light interference this device splits light  into two path then then rejoin and split again and  
you can alter the light that passes through one  of these path to multiply the light with a certain  
value so we multiply the input matrix through this  MZI cells with the weight and then sum it up with  
the optical attenuator and finally we decode the  result through the diffraction layer and the most  
Results
interesting thing here is that classical computers  operate in serial fashion means one operation  
being performed after another one and in this case  to perform many operations in parallel we need to  
have many GPUs for example to compute in parallel  but when it comes to photonic computing by its  
nature it can perform many operations in parallel  because we can compute at multiple wavelength of  
light at the same time and that's brilliant now  what differentiates this chip from photonic chips  
that we discussed in the past first of all it can  perform more advanced Computing tasks if we take  
AI application as an example previous Optical  chips were able to handle hundreds of thousands  
of parameters while this new Tai Chi chip can  handle up to 14 million parameters this means  
it can perform much more advanced tasks when it  comes for example to image classification they've  
tested the chip with the data set which contains  thousands of different handwritten characters from  
50 different alphabets and this chip was able to  perform image classification with 92% accuracy  
which is great for a photonic chip because it's  analog and one of the main problem with analog  
is exactly the accuracy for example not that long  ago I was reading a paper research paper about  
the light matter Chip And as far as I remember  the accuracy was back then about 80% and you see  
in this work they achieved already 92% moreover  researchers tested this Tai Chi chip on generative  
AI tasks and this is very interesting because you  can really see that this photonic stuff actually  
works this chip can produce music in the style of  German composer Bach and it can already draw or  
more accurately to say generate landscapes in the  styles of Vincent can Gogh and Edward Munch who is  
well known for his famous painting this cream and  while this chip was performing these operations  
they've measured it and is capable of 16o TOPs  per watt and if we look at the performance  
comparison from the paper it's reportedly more  than 1,000 times more energy efficient than any  
of the latest Nvidia H100 gpus and then when  they compared it to the previous research it  
turned out to be roughly 100 times more energy  efficient and 10 times more area efficient than  
previous photonic chips and you know area is  one of the biggest problems when it comes to  
photonics you know while this chip itself is quite  compact the entire system is not because they have  
used a Laser Source right and this can be the  size of the whole table and I don't know which  
exactly laser they used but in general it can  consume up to one kilowatt and this crashes all  
the efficiency gains we've just discussed you know  all these Optical components in general are quite  
bulky for example this MZI cell we discussed is  about 50 micrometer dimensions so it's huge when  
we compare it to the world of the semiconductor  chips where we have transistors in the range of  
nanometers and quite some cheap logic can fit on  the area of a single photonic device and of course  
many faps and many researchers are working on the  further miniaturisation of photonic components  
but it's still nowhere near the conventional  computer chips however as we saw earlier this  
ability to perform multiple calculations at  the different wavelength of light is a great  
alternative way to scale the computing without  just scaling the number of components so it can  
compensate for that all in all it's a great work  first of all they've built a chiplet that can  
run neural network with millions of parameters  and from the paper I can see that they have an  
idea how to scale this chip further and yes it's  clear that it's just for inference application  
right now and it won't be in your computer at  home tomorrow but it's a building block to to  
to create the next generation of Technology if  you've ever enjoyed my videos please share it  
with your friends and colleagues and on social  media this helps the channel to grow a lot  
now check out my previous video which many of you  enjoyed a lot where I explain how we can scale  