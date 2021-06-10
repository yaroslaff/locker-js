class Locker {
    
    constructor(base_url){    
        if (base_url.substr(-1) != '/') base_url += '/';
        this.base_url = base_url
        this.authenticated = false
        this.hook_login = null
    }


    logout(){
        fetch(this.base_url + 'logout', {method: 'POST', credentials: 'include'})
        .then( r=> {
            if(r.status == 200){
                this.authenticated=false
                this.update_page()    
            }
        })
        .catch(e => {
            console.log("logout error", e)
        })
    }

    url(path){
        var url = new URL(path, this.base_url)
        return url.href
    }

    update_page(){

        var visible;

        // update Login links
        const providers = ['google', 'auth0']
        
        for(let provider of providers){
            for(let e of document.getElementsByClassName(`locker-login-link-${provider}`)){
                // e.href = this.base_url + `oidc/login/${provider}?return=${window.location}`
                //e.onclick = () => { this.locker_oauth2_login(provider) }
                //e.href = ""
                
                const form_id = `locker-login-form-${provider}`
                var form = document.getElementById(form_id)

                if(!form){
                    const new_form = document.createElement('form');
    
                    new_form.id = form_id;
                    new_form.method = 'POST';
                    new_form.action = this.url(`oidc/login/${provider}?return=${window.location}`);
                    document.body.appendChild(new_form);
                }

                e.onclick = () => {
                    this.authenticated = null; 
                    this.update_page(); 
                    form.submit()
                }
            }
        }

        // update visible elements
        if(this.authenticated === null){
            visible = "locker-authenticating"
        }else if(this.authenticated){
            visible = "locker-authenticated"
        }else{
            visible = "locker-unauthenticated"
        }

        //console.log("visible:", visible)

        for(let classname of ['locker-authenticating', 'locker-authenticated', 'locker-unauthenticated']){
            let display = (classname == visible) ? 'block' : 'none'            
            //console.log("set", classname, display)
            for(let e of document.getElementsByClassName(classname)){
                //console.log("update", e)
                e.style.display = display
            }    
        }
        /*
        for(let e of document.getElementsByClassName('locker-onload')){            
            e.style.display = 'block'
        } 
        */
                      
    }

    async check_authenticated(){
        return fetch(this.base_url + 'authenticated', {credentials: 'include'})
        .then( r => r.json() )        
    }

    async check_login(){        
        //var a = await this.is_authenticated()
        //console.log("authenticated: ", a)
        this.authenticated = null
        this.update_page()
        
        if(await this.check_authenticated()){
            if(this.hook_login){
                this.hook_login()
            }
            this.authenticated = true
        }else{
            this.authenticated = false
        }
        //console.log(this.authenticated)
        this.update_page()            
    }
    

    get(path){
        return fetch(this.base_url + path, {credentials: 'include'})
    }

    put(path, data){
        return fetch(this.base_url + path, 
            {
                credentials: 'include', 
                method: 'PUT', 
                body: data
            })
    }

    /* low-level method to send POST requests */
    post(path, data){
        return fetch(this.base_url + path, 
            {
                credentials: 'include', 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
    }

    set_flag(flag, path='/var/flags.json'){

        var data = {
            'action': 'set_flag',
            'set_flag': flag
        }
        return this.post(path, data)
    }

    drop_flag(flag, path='/var/flags.json', timestamp=null){

        var data = {
            'action': 'drop_flag',
            'drop_flag': flag,
            'timestamp': timestamp
        }

        return this.post(path, data)
    }

    get_json_file(path, code){
        fetch(this.base_url + path, {credentials: 'include'})
        .then( r => {
            return r.json()
        })
        .then(data => {code(data)})
    }
}
