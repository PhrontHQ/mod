# Mutable String

For large edits, this would be critical, and open the door to track range changes in a string within a text area and directly update that range in the corresponding underlaying data level MutableString. Not only locally, but it would facilitate propagating those changes to other users looking at the same MutableString.

There are specific and specialized implementations, called "ropes" that designed to be efficient for that purpose. 

We should adopt one and use it as the implementation for Mod's MutableString class, which can now with ES6 be packaged as a true subclass of String


## References

### Rope
- [https://github.com/josephg/jumprope](https://github.com/josephg/jumprope)
- [https://github.com/component/rope](https://github.com/component/rope)
- [Rope Data Structure](https://en.wikipedia.org/wiki/Rope_(data_structure))
- (Efficient string building in JavaScript)[https://dev.to/andreygermanov/efficient-string-building-in-javascript-2bej]
- 



### Binary / Buffer / String

- [https://github.com/WebAssembly/js-string-builtins/blob/main/proposals/js-string-builtins/Overview.md](https://github.com/WebAssembly/js-string-builtins/blob/main/proposals/js-string-builtins/Overview.md)

- [https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string](https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays)
- [https://bun.sh/guides/binary/buffer-to-string](https://bun.sh/guides/binary/buffer-to-string)
- [https://bun.sh/guides/binary/arraybuffer-to-string](https://bun.sh/guides/binary/arraybuffer-to-string)
- [https://lemire.me/blog/2023/12/08/fast-buffer-to-string-conversion-in-javascript-with-a-lookup-table/](https://lemire.me/blog/2023/12/08/fast-buffer-to-string-conversion-in-javascript-with-a-lookup-table/)
- [String Builder](https://www.google.com/search?q=StringBuilder+Javascript&client=safari&sca_esv=ca0e7ba2501edfa5&rls=en&ei=WFzYaKW4CqOm0PEP08a22Ag&ved=0ahUKEwilxMG49vmPAxUjEzQIHVOjDYsQ4dUDCBA&uact=5&oq=StringBuilder+Javascript&gs_lp=Egxnd3Mtd2l6LXNlcnAiGFN0cmluZ0J1aWxkZXIgSmF2YXNjcmlwdDIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYRzIKEAAYsAMY1gQYR0jgA1AAWABwAXgBkAEAmAEAoAEAqgEAuAEDyAEAmAIBoAIImAMAiAYBkAYIkgcBMaAHALIHALgHAMIHAzItMcgHBQ&sclient=gws-wiz-serp)
- [TextEncoder](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder)
- [https://github.com/tadashibashi/js-stringbuilder](https://github.com/tadashibashi/js-stringbuilder)
- [text string rope data structure create LLM embeddings ](https://www.google.com/search?q=text+string+rope+data+structure+create+LLM+embeddings &client=safari&sca_esv=b04edf4c6777ddf8&rls=en&tbs=qdr:y&ei=e_7OZ7zwMYvn5NoPh72YsA0&start=10&sa=N&sstk=Af40H4We_rGwgmhm4piDt1Yb8cKor1SbeJ0HhaMyKz-Jw-cS8XkAcfGmkx4syXdiMiN3p-kx9eRV6g3b3X4FEsdxKABQb-c5P-Fvyw&ved=2ahUKEwj8mfPU4_-LAxWLM1kFHYceBtYQ8NMDegQIBxAW&biw=1920&bih=1182&dpr=2
)
- [https://mccormickml.com/2025/01/18/continuing-pre-training-on-raw-text/](https://mccormickml.com/2025/01/18/continuing-pre-training-on-raw-text/)
- [https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers](https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers)