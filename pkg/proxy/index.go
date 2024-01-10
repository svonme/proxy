package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strings"
)

type Service struct{}

func replace(text string) string {
	if len(text) > 0 && text[0:1] == "/" {
		src := strings.Replace(text, "/", "", 1)
		return replace(src)
	}
	return text
}

func isUrl(value string) bool {
	// 定义正则表达式模式
	pattern := "^/{0,}https?"
	// 编译正则表达式
	re, _ := regexp.Compile(pattern)
	// 使用正则表达式进行匹配
	return re.MatchString(value)
}

func urlFormat(value string, proxyUrl string) *url.URL {
	if len(value) > 0 && isUrl(value) {
		index := strings.Index(value, ":")
		if index < 0 {
			index = 0
		}
		// 获取 url 协议
		scheme := replace(value[0:index])
		// 获取 url 域名和路径
		link := replace(value[index+1:])
		if len(proxyUrl) > 0 {
			// 如果有自定义的代理地址
			data, _ := url.Parse(fmt.Sprintf("%s://%s", scheme, link))
			return data
		} else {
			// 使用三方开源代理
			tmp, _ := url.Parse(fmt.Sprintf("%s://%s", scheme, link))
			data, _ := url.Parse(
				fmt.Sprintf(
					"https://proxy.iprouter.top/%s",
					url.QueryEscape(tmp.String()),
				),
			)
			return data
		}
	}
	return nil
}

func transport(remote string) *http.Transport {
	if len(remote) > 0 {
		proxyURL, _ := url.Parse(remote)
		return &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		}
	}
	return nil
}

func (s *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	proxyValue := r.Header.Get("proxy")
	remote := urlFormat(r.URL.String(), proxyValue)
	// 如果请求地址为空
	if remote == nil {
		// 尝试使用 referer 字段数据进行重新拼装请求地址
		referer := r.Header.Get("referer")
		if len(referer) > 0 {
			index := strings.Index(referer, "/http")
			if index >= 0 {
				value, _ := url.JoinPath(referer[index+1:], r.URL.String())
				remote = urlFormat(value, proxyValue)
			}
		}
	}
	if remote != nil {
		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ModifyResponse = s.customModResponse
		if len(proxyValue) > 0 {
			proxy.Transport = transport(proxyValue)
		}
		director := proxy.Director
		proxy.Director = func(req *http.Request) {
			director(r)
			req.URL.Path = remote.Path
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.Host = remote.Host
			req.Header.Del("proxy")
			fmt.Println(req)
		}
		proxy.ServeHTTP(w, r)
	} else {
		w.Write([]byte{})
	}
}

func (s *Service) customModResponse(r *http.Response) error {
	r.Header.Add("Cache-Control", "no-store")
	return nil
}
