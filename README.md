# locker-js

Locker-js is frontend library for working with locker server

## Developers documentation (draft)

### Quickstart
~~~js
locker_addr = 'https://myapp-myname.locker.server.address'
locker = new Locker(locker_addr)

window.onload = async () => {
  locker.hook_login = load_data
  locker.check_login()
}

async function load_data(){
    /* your code */
}
~~~

### Reference

#### check_login()
`check_login()` asks locker server, if user authenticated or not and updates page accordingly using `update_page()` and calls proper hook (`hook_after_check_login`). 

check_login uses local cache in localStorage(), cache lifetime is limited by `authenticated_cachetime` attribute, set it to -1 to disable cacheing

#### update_page()
`update_page()` uses naming convention to automatically update pages to current login status (show different content for authenticated and non-authenticated users).

For elements with classes `locker-login-link-${provider}` (e.g. `locker-login-link-google`) it creates proper onclick js code to perform authentication.

Application could be in three states: `unauthenticated`, `authenticated` and `authenticating`. For all elements with class name `locker-${state}` update_page() either sets `display` attribute to `block` or `none`.


#### get(path)
Fetches (downloads) user data file from locker server:
~~~js
  locker.get('~/rw/notebook.txt')
    .then(response => {
      return response.text()
    })
    .then(text => {
      document.getElementById("notebook").value = text
    })
    .catch(e => {
      console.log("no notebook", e)
    })
~~~

#### put(path, data)
Uploads data from application to user file on locker server:
~~~~js
  data = document.getElementById("notebook").value
  locker.put('~/rw/notebook.txt', data)
~~~~

#### get_json_file(path, code)
~~~js
  locker.get_json_file('~/r/userinfo.json', data => {
    document.getElementById("profile").innerText = `Hello, ${data['name']} <${data['email']}>!`
  })
~~~

#### set_flag(flag, path='/var/flags.json')
Sets flag *name* in flag file *path*.
~~~js
locker.set_flag('myflag')
~~~

Each flag automatically includes userid and timestamp which are added on server.

#### drop_flag(flag, path, timestamp=null)
Drop flag *name* in flag file *path*. If timestamp is specified, flag is dropped only if it's older then timestamp.

#### Hooks

##### hook_after_check_login
called with login_status structure as argument, example:
~~~js
login_status = {
    messages: ['Reuse cached value from localStorage'],
    status: true
}
~~~

Programmer may use this hook to perform custom actions after login checks
