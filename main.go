package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"proxy/pkg/proxy"
)

func main() {
	port := "8080"
	if len(os.Args) >= 2 && len(os.Args[1]) > 0 {
		port = os.Args[1]
	}
	address := fmt.Sprintf("0.0.0.0:%s", port)

	server := &proxy.Service{}
	fmt.Printf("http://127.0.0.1:%s\n", port)
	log.Fatal(http.ListenAndServe(address, server))

}
