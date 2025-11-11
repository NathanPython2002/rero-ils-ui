/*
 * RERO ILS UI
 * Copyright (C) 2021-2024 RERO
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Error, Record } from '@rero/ng-core';
import { forkJoin, from, map, Observable, switchMap, tap } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import { LoanApiService } from '../../api/loan-api.service';
import { PatronProfileMenuService } from '../patron-profile-menu.service';


@Component({
    selector: 'public-search-patron-profile-loans',
    templateUrl: './patron-profile-loans.component.html',
    standalone: false
})
export class PatronProfileLoansComponent implements OnInit {

  private loanApiService: LoanApiService = inject(LoanApiService);
  private patronProfileMenuService: PatronProfileMenuService = inject(PatronProfileMenuService);


  /** data is loaded */
  loaded = false;

  /** loans records */
  loans: WritableSignal<any[]> = signal([]);

  /** renewable loans */
  renewableLoans = computed<any[]>(() => this.loans().filter(loan => loan.canExtend?.can));

  //});
  

  /** sort criteria */
  sortCriteria = 'duedate';

  /** OnInit hook */
  ngOnInit(): void {
    this.selectingSortCriteria(this.sortCriteria);
  }

  /**
   * Loan query
   * @param page - number
   * @return Observable
   */
  private loanQuery(): Observable<Record | Error> {
    const patronPid = this.patronProfileMenuService.currentPatron.pid;
    return this.loanApiService
      .getOnLoan(patronPid, 1, 9999, undefined, this.sortCriteria);
  }


   /**
    * Allow to sort loans list using a sort criteria
    * @param sortCriteria: the sort criteria to use for sorting the list
    */
  selectingSortCriteria(sortCriteria: string) {
    this.sortCriteria = sortCriteria;

    let currentLoans = [];
    //this.loanApiService.canExtend() 
    this.loanQuery().pipe(
      map((response: Record) => {
        if (response.hits.total.value === 0) {
          return [];
        }
        return response.hits.hits;
      }),
      tap((loans: any[]) => currentLoans = loans),
      map((loans: any[]) => loans.map(loan => loan.metadata.pid )),
      switchMap((loanPids : string []) => forkJoin(loanPids.map((pid: string) => this.loanApiService.canExtend(pid)))),
      map((canExtendResponses) => {
        for (let i = 0; i < canExtendResponses.length; i++) {
          currentLoans[i].canExtend = canExtendResponses[i];
        } 
        return currentLoans; 
      }),
      tap((response) => console.log(response)),
    ).subscribe((loans) => {
      
      this.loans.set(loans);
      this.loaded = true;
    });
  }
renewAllLoans() {  
      const patronPid = this.patronProfileMenuService.currentPatron.pid;
      const observables: Observable<any>[] = this.renewableLoans().map(loan => 
        this.loanApiService.renew({
          pid: loan.metadata.pid,
          item_pid: loan.metadata.item.pid,
          transaction_location_pid: loan.metadata.item.location.pid,
          transaction_user_pid: patronPid
        }));
    this.renewInProgress = true;
    this.loanApiService.renew({
      pid: this.record.metadata.pid,
      item_pid: this.record.metadata.item.pid,
      transaction_location_pid: this.record.metadata.item.location.pid,
      transaction_user_pid: patronPid
    })
  const observables: Observable<any>[] = [];
  from (observables).pipe(
      concatMap(obs => obs),
      toArray(),
      tap((newItems: any[]) =>
        newItems.map((newItem: any) => {
            })
          ),
      )
      .subscribe({
        next: () => {
        },
        error: (err) => {
          console.log('Error during the renew all process');
        }
      });
    }
  }

