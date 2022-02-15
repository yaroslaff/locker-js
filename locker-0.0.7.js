/* Main Locker class */
class Locker {
    
    constructor(base_url){    
        if (base_url.substr(-1) != '/') base_url += '/';
        this.base_url = base_url
        this.authenticated = false
        this.authenticated_cachetime = 60

        this.preload = {}

        /* App may override this */
        /* ... options */
        this.return_url = window.location

        /* ... hooks */
        this.hook_after_check_login = null
        this.hook_after_logout = null
    }


    logout(){
        fetch(this.base_url + 'logout', {method: 'POST', credentials: 'include'})
        .then( r => {
            if(r.status == 200){
                this.set_authenticated(false)
                
                if(this.hook_after_logout){
                    this.hook_after_logout({status: false})
                }else{
                    this.update_page()
                }
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

    get_pubconf(){
        return this.get('/pubconf')
            .then( r => r.json() )     
            .then( pubconf => this.pubconf = pubconf)       
    }
    

    preload_json_file(file){
        return this.get(file)
            .then( r => r.json() )     
            .then( data => this.preload[file] = data)       
    }

    preload_json_files(elements=null){
        if(elements==null){
            console.log("use default elements")
            elements = ['/pubconf', '~/r/userinfo.json']
        }
        let promises = []
        elements.forEach( e => promises.push(this.preload_json_file(e)))
        return Promise.all(promises)
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
                    new_form.action = this.url(`oidc/login/${provider}?return=${this.return_url}`);
                    document.body.appendChild(new_form);
                    form = new_form
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

    set_authenticated(value){
        this.authenticated = value
        if(value){
            localStorage['authenticated'] = unixtime()
        }else{
            localStorage.removeItem('authenticated')
        }
    }

    async check_login(){        
        
        var login_status = null;
        
        var now = unixtime()
        var cache_age = now - localStorage.getItem('authenticated')

        if(cache_age < this.authenticated_cachetime){
            /* reuse cached value */
            login_status = {
                messages: ['Reuse cached value from localStorage'],
                status: true
            }
            this.authenticated = true
        }else{
            /* temporary set null to draw progress */
            this.set_authenticated(null)
            login_status = await this.check_authenticated()
            this.set_authenticated(login_status.status)
        }
        this.update_page()

        if(this.hook_after_check_login){
            this.hook_after_check_login(login_status)
        }

        return login_status
    }
    

    get(path){
        return fetch(this.url(path), {credentials: 'include'})
    }

    put(path, data){
        return fetch(this.url(path), 
            {
                credentials: 'include', 
                method: 'PUT', 
                body: data
            })
    }

    post(path, data){
        return fetch(this.url(path), 
            {
                credentials: 'include', 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
    }

    list_append(path, e){
        return this.post(path, {
            action: 'list_append',
            e: e
          })        
    }

    list_delete(path, _id){
        return this.post(path, {
            action: 'list_append',
            _id: _id
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


/* misc utility functions */
function unixtime(){
    return Math.floor(new Date().valueOf()/1000)
}
